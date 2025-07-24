import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateProjectStore } from '../redux/project'
import { ProjectList } from '../api/project'
import { GetUserInfo } from '../api/auth'
import { checkSession } from '../util/util'

export function useProjectData() {
  const dispatch = useDispatch()
  const { project_list, user } = useSelector((s) => s.ProjectStore)
  
  useEffect(() => {
    const loadProjectData = async () => {
      const session = checkSession()
      if (!session) {
        console.log('[useProjectData] No session found')
        return
      }
      
      // 이미 로드된 경우 스킵
      if (project_list && project_list.length > 0 && user) {
        console.log('[useProjectData] Data already loaded, skipping')
        return
      }
      
      try {
        console.log('[useProjectData] Loading project data...')
        
        // 사용자 정보 로드
        const userResponse = await GetUserInfo()
        if (userResponse?.data?.result) {
          dispatch(updateProjectStore({
            user: userResponse.data.result.email,
            profileImage: userResponse.data.result.profile_image || null
          }))
        }
        
        // 프로젝트 리스트 로드
        const projectResponse = await ProjectList()
        if (projectResponse?.data?.result) {
          dispatch(updateProjectStore({
            project_list: projectResponse.data.result
          }))
          console.log('[useProjectData] Loaded projects:', projectResponse.data.result.length)
        }
      } catch (error) {
        console.error('[useProjectData] Error loading data:', error)
      }
    }
    
    loadProjectData()
  }, [dispatch, project_list, user])
  
  return { project_list, user }
}