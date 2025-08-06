import { optimizedAxios, axiosCredentialsWithCache } from './optimizedAxios';
import { handleApiError } from '../utils/errorHandler';
import cacheManager from '../utils/cacheManager';

/**
 * 캐싱이 최적화된 프로젝트 API
 * 기존 project.js API를 점진적으로 교체하기 위한 최적화된 버전
 */

// 프로젝트 리스트 - 캐싱 우선
export async function getProjectListOptimized() {
  console.log('[API] Optimized ProjectList called at:', new Date().toISOString());
  
  try {
    const response = await axiosCredentialsWithCache('get', '/api/projects/project_list/');
    
    if (response.cached) {
      console.log('[API] ProjectList served from cache');
    }
    
    return response;
  } catch (error) {
    console.error('[API] ProjectList failed:', error);
    handleApiError(error, {
      404: '프로젝트 목록을 찾을 수 없습니다.',
      403: '프로젝트 목록에 접근할 권한이 없습니다.'
    });
    throw error;
  }
}

// 프로젝트 상세 조회 - 캐싱 + 실시간 동기화
export async function getProjectOptimized(projectId) {
  if (!projectId) {
    throw new Error('Project ID is required');
  }
  
  try {
    const response = await axiosCredentialsWithCache(
      'get', 
      `/api/projects/detail/${projectId}/`
    );
    
    if (response.cached) {
      console.log(`[API] Project ${projectId} served from cache`);
      
      // 백그라운드에서 최신 데이터 확인
      optimizedAxios.get(`/api/projects/detail/${projectId}/`)
        .then(freshResponse => {
          if (JSON.stringify(freshResponse.data) !== JSON.stringify(response.data)) {
            console.log(`[API] Project ${projectId} updated in background`);
          }
        })
        .catch(error => {
          console.warn(`[API] Background update failed for project ${projectId}:`, error);
        });
    }
    
    return response;
  } catch (error) {
    console.error(`[API] GetProject ${projectId} failed:`, error);
    handleApiError(error, {
      404: '프로젝트를 찾을 수 없습니다.',
      403: '프로젝트에 접근할 권한이 없습니다.'
    });
    throw error;
  }
}

// 원자적 프로젝트 생성 - 즉시 캐시 무효화
export async function createProjectOptimized(data) {
  // 기존 멱등성 키 생성 로직 유지
  const userKey = `${data.name}_${data.manager}_${Date.now()}`;
  
  const b64EncodeUnicode = (str) => {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    );
  };
  
  const idempotencyKey = b64EncodeUnicode(userKey).replace(/[/+=]/g, '').substring(0, 32);
  
  console.log('[API] Optimized CreateProject called:', data.name);
  console.log('[API] Idempotency key:', idempotencyKey);
  
  try {
    const response = await optimizedAxios.post(
      '/api/projects/create/',
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        }
      }
    );
    
    // 성공 시 관련 캐시 즉시 무효화
    await Promise.all([
      cacheManager.invalidateCacheByEvent('project-created'),
      // 예측적 캐싱: 새로 생성된 프로젝트 상세 정보
      response.data?.id ? optimizedAxios.prefetch(`/api/projects/detail/${response.data.id}/`) : Promise.resolve()
    ]);
    
    console.log('[API] Project created and cache invalidated');
    return response;
    
  } catch (error) {
    console.error('[API] CreateProject failed:', error);
    handleApiError(error, {
      400: '프로젝트 생성 요청이 올바르지 않습니다.',
      409: '이미 같은 이름의 프로젝트가 존재합니다.',
      403: '프로젝트를 생성할 권한이 없습니다.'
    });
    throw error;
  }
}

// 프로젝트 업데이트 - 스마트 캐시 무효화
export async function updateProjectOptimized(data, projectId) {
  if (!projectId) {
    throw new Error('Project ID is required for update');
  }
  
  try {
    const response = await optimizedAxios.post(
      `/api/projects/detail/${projectId}/`,
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      }
    );
    
    // 업데이트 성공 시 관련 캐시 무효화
    await Promise.all([
      cacheManager.invalidateCacheByEvent('project-updated'),
      // 특정 프로젝트 캐시도 무효화
      cacheManager.invalidateCache(`/api/projects/detail/${projectId}/`)
    ]);
    
    console.log(`[API] Project ${projectId} updated and cache invalidated`);
    return response;
    
  } catch (error) {
    console.error(`[API] UpdateProject ${projectId} failed:`, error);
    handleApiError(error, {
      404: '수정할 프로젝트를 찾을 수 없습니다.',
      403: '프로젝트를 수정할 권한이 없습니다.',
      400: '프로젝트 수정 요청이 올바르지 않습니다.'
    });
    throw error;
  }
}

// 프로젝트 삭제 - 전체 관련 캐시 정리
export async function deleteProjectOptimized(projectId) {
  if (!projectId) {
    throw new Error('Project ID is required for deletion');
  }
  
  try {
    const response = await optimizedAxios.delete(`/api/projects/detail/${projectId}/`);
    
    // 삭제 성공 시 모든 관련 캐시 무효화
    await Promise.all([
      cacheManager.invalidateCacheByEvent('project-deleted'),
      // 프로젝트 관련 모든 캐시 무효화
      cacheManager.invalidateCache(`/api/projects/detail/${projectId}/`),
      cacheManager.invalidateCache(`/api/projects/${projectId}/feedbacks/`),
      cacheManager.invalidateCache(`/api/projects/${projectId}/`)
    ]);
    
    console.log(`[API] Project ${projectId} deleted and all related cache cleared`);
    return response;
    
  } catch (error) {
    console.error(`[API] DeleteProject ${projectId} failed:`, error);
    handleApiError(error, {
      404: '삭제할 프로젝트를 찾을 수 없습니다.',
      403: '프로젝트를 삭제할 권한이 없습니다.'
    });
    throw error;
  }
}

// 프로젝트 멤버 초대 - 관련 프로젝트 캐시 무효화
export async function inviteProjectOptimized(data, projectId) {
  if (!projectId) {
    throw new Error('Project ID is required for invitation');
  }
  
  try {
    const response = await optimizedAxios.post(
      `/api/projects/${projectId}/invitation/`,
      data
    );
    
    // 초대 성공 시 프로젝트 상세 캐시 무효화 (멤버 목록 변경)
    await cacheManager.invalidateCache(`/api/projects/detail/${projectId}/`);
    
    console.log(`[API] Project ${projectId} invitation sent and cache updated`);
    return response;
    
  } catch (error) {
    console.error(`[API] InviteProject ${projectId} failed:`, error);
    handleApiError(error, {
      404: '프로젝트를 찾을 수 없습니다.',
      403: '멤버를 초대할 권한이 없습니다.',
      400: '초대 요청이 올바르지 않습니다.'
    });
    throw error;
  }
}

// 프로젝트 초대 수락 - 캐싱된 사용자 프로젝트 목록 갱신
export async function acceptInviteOptimized(uid, token) {
  if (!uid || !token) {
    throw new Error('UID and token are required for invitation acceptance');
  }
  
  console.log('[API] Optimized AcceptInvite called with:', { uid, token });
  
  const url = `/api/projects/invite/${uid}/${token}/`;
  console.log('[API] AcceptInvite URL:', url);
  
  try {
    const response = await optimizedAxios.get(url);
    
    // 초대 수락 시 사용자의 프로젝트 목록 갱신
    await Promise.all([
      cacheManager.invalidateCache('/api/projects/project_list/'),
      cacheManager.invalidateCache('/api/user/profile/') // 사용자 프로필 정보도 업데이트
    ]);
    
    console.log('[API] Invitation accepted and user project cache updated');
    return response;
    
  } catch (error) {
    console.error('[API] AcceptInvite error:', error);
    
    if (error.response?.status === 404) {
      console.error('[API] 404 Error Details:', {
        requestedURL: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.request?.responseURL,
        response: error.response?.data
      });
    }
    
    handleApiError(error, {
      404: '초대 링크가 유효하지 않거나 만료되었습니다.',
      400: '잘못된 초대 링크입니다.',
      403: '이미 프로젝트에 참여하고 있습니다.'
    });
    throw error;
  }
}

// 프로젝트 기간 변경 - 스케줄 관련 캐시 업데이트
export async function updateProjectDateOptimized(data, projectId) {
  if (!projectId) {
    throw new Error('Project ID is required for date update');
  }
  
  console.log('[API] Optimized UpdateDate called with:', {
    projectId,
    data,
    url: `/api/projects/date_update/${projectId}`
  });
  
  try {
    const response = await optimizedAxios.post(
      `/api/projects/date_update/${projectId}`,
      data
    );
    
    // 날짜 업데이트 시 관련 캐시 무효화
    await Promise.all([
      cacheManager.invalidateCache(`/api/projects/detail/${projectId}/`),
      cacheManager.invalidateCache('/api/projects/project_list/'), // 목록에서도 날짜 표시
      // 캘린더나 스케줄 관련 캐시가 있다면 여기서 무효화
    ]);
    
    console.log('[API] Project date updated and cache refreshed');
    return response;
    
  } catch (error) {
    console.error('[API] UpdateDate error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    handleApiError(error, {
      404: '프로젝트를 찾을 수 없습니다.',
      403: '프로젝트 일정을 수정할 권한이 없습니다.',
      400: '날짜 형식이 올바르지 않습니다.'
    });
    throw error;
  }
}

// 메모 작성 - 프로젝트 상세 캐시 부분 업데이트
export async function writeProjectMemoOptimized(data, projectId) {
  if (!projectId) {
    throw new Error('Project ID is required for memo');
  }
  
  try {
    const response = await optimizedAxios.post(
      `/api/projects/memo/${projectId}/`,
      data
    );
    
    // 메모 추가 시 프로젝트 상세 정보 캐시 무효화
    await cacheManager.invalidateCache(`/api/projects/detail/${projectId}/`);
    
    console.log(`[API] Memo added to project ${projectId} and cache updated`);
    return response;
    
  } catch (error) {
    console.error(`[API] WriteMemo ${projectId} failed:`, error);
    handleApiError(error, {
      404: '프로젝트를 찾을 수 없습니다.',
      403: '메모를 작성할 권한이 없습니다.',
      400: '메모 내용이 올바르지 않습니다.'
    });
    throw error;
  }
}

// 프로젝트 파일 삭제 - 관련 캐시 정리
export async function deleteProjectFileOptimized(fileId) {
  if (!fileId) {
    throw new Error('File ID is required for deletion');
  }
  
  try {
    const response = await optimizedAxios.delete(`/api/projects/file/delete/${fileId}/`);
    
    // 파일 삭제 시 관련 프로젝트의 캐시 무효화
    // 파일이 속한 프로젝트를 특정하기 어려우므로 전체 프로젝트 캐시 무효화
    await cacheManager.invalidateCache('/api/projects/');
    
    console.log(`[API] File ${fileId} deleted and project cache updated`);
    return response;
    
  } catch (error) {
    console.error(`[API] DeleteFile ${fileId} failed:`, error);
    handleApiError(error, {
      404: '삭제할 파일을 찾을 수 없습니다.',
      403: '파일을 삭제할 권한이 없습니다.'
    });
    throw error;
  }
}

/**
 * 배치 작업을 위한 헬퍼 함수들
 */

// 여러 프로젝트 동시 조회 (병렬 처리 + 캐싱)
export async function getMultipleProjectsOptimized(projectIds) {
  if (!Array.isArray(projectIds) || projectIds.length === 0) {
    return [];
  }
  
  try {
    const promises = projectIds.map(id => getProjectOptimized(id));
    const results = await Promise.allSettled(promises);
    
    const projects = [];
    const errors = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        projects.push(result.value);
      } else {
        errors.push({ projectId: projectIds[index], error: result.reason });
      }
    });
    
    if (errors.length > 0) {
      console.warn('[API] Some projects failed to load:', errors);
    }
    
    return projects;
    
  } catch (error) {
    console.error('[API] GetMultipleProjects failed:', error);
    throw error;
  }
}

// 프로젝트 검색 (캐싱된 목록에서 필터링)
export async function searchProjectsOptimized(query, filters = {}) {
  if (!query && Object.keys(filters).length === 0) {
    return getProjectListOptimized();
  }
  
  try {
    // 전체 프로젝트 목록을 캐시에서 가져오기
    const response = await getProjectListOptimized();
    let projects = response.data || [];
    
    // 클라이언트 사이드 필터링 (서버 부하 감소)
    if (query) {
      const searchQuery = query.toLowerCase();
      projects = projects.filter(project => 
        project.name?.toLowerCase().includes(searchQuery) ||
        project.description?.toLowerCase().includes(searchQuery) ||
        project.manager?.toLowerCase().includes(searchQuery)
      );
    }
    
    // 추가 필터 적용
    if (filters.status) {
      projects = projects.filter(project => project.status === filters.status);
    }
    
    if (filters.category) {
      projects = projects.filter(project => project.category === filters.category);
    }
    
    console.log(`[API] Searched projects: ${projects.length} results for "${query}"`);
    
    return {
      ...response,
      data: projects,
      searchQuery: query,
      filters,
      cached: response.cached
    };
    
  } catch (error) {
    console.error('[API] SearchProjects failed:', error);
    throw error;
  }
}

/**
 * 기존 API와의 하위 호환성을 위한 래퍼 함수들
 */

// 기존 API 함수명 유지 (점진적 마이그레이션용)
export const ProjectList = getProjectListOptimized;
export const GetProject = getProjectOptimized;
export const CreateProjectAPI = createProjectOptimized;
export const UpdateProjectAPI = updateProjectOptimized;
export const DeleteProjectAPI = deleteProjectOptimized;
export const InviteProject = inviteProjectOptimized;
export const AcceptInvite = acceptInviteOptimized;
export const UpdateDate = updateProjectDateOptimized;
export const WriteMemo = writeProjectMemoOptimized;
export const FileDeleteAPI = deleteProjectFileOptimized;

export default {
  // 새로운 최적화된 함수들
  getProjectListOptimized,
  getProjectOptimized,
  createProjectOptimized,
  updateProjectOptimized,
  deleteProjectOptimized,
  inviteProjectOptimized,
  acceptInviteOptimized,
  updateProjectDateOptimized,
  writeProjectMemoOptimized,
  deleteProjectFileOptimized,
  getMultipleProjectsOptimized,
  searchProjectsOptimized,
  
  // 하위 호환성을 위한 기존 함수명
  ProjectList,
  GetProject,
  CreateProjectAPI,
  UpdateProjectAPI,
  DeleteProjectAPI,
  InviteProject,
  AcceptInvite,
  UpdateDate,
  WriteMemo,
  FileDeleteAPI
};