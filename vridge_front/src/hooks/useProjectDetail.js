import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setGlobalLoading } from '../redux/loading';
import { GetProject } from '../api/project';

// 프로젝트 상세 정보를 가져오는 커스텀 훅
// 중복 API 호출 방지 및 캐싱 기능 포함
export function useProjectDetail(projectId) {
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const lastFetchedId = useRef(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }

    // 이미 로드한 프로젝트면 스킵
    if (lastFetchedId.current === projectId && project?.id === projectId) {

      return;
    }

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새 요청 시작
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const fetchProject = async () => {
      setIsLoading(true);
      setError(null);

      try {

        const response = await GetProject(projectId, { signal });

        if (response.data?.result) {
          setProject(response.data.result);
          lastFetchedId.current = projectId;

        }
      } catch (err) {
        if (err.name === 'AbortError') {

          return;
        }

        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();

    // 클린업
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [projectId]);

  // 수동 새로고침 함수
  const refetch = async () => {
    if (!projectId) return;

    lastFetchedId.current = null; // 캐시 무효화

    setIsLoading(true);
    setError(null);

    try {
      const response = await GetProject(projectId);
      if (response.data?.result) {
        setProject(response.data.result);
        lastFetchedId.current = projectId;
      }
    } catch (err) {
      
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return { project, isLoading, error, refetch };
}