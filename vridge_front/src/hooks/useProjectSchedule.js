/**
 * 프로젝트 일정 관리를 위한 커스텀 Hook
 */
import { useState, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import projectScheduleService from '../services/projectScheduleService'
import { toast } from 'react-toastify'

const showSuccess = (message) => toast.success(message)
const showError = (message) => toast.error(message)
const showWarning = (message) => toast.warning(message)

export function useProjectSchedule() {
  const dispatch = useDispatch()
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateProgress, setUpdateProgress] = useState(null)
  
  /**
   * 단일 단계 업데이트
   */
  const updatePhase = useCallback(async (projectId, phaseData, navigate) => {
    setIsUpdating(true)
    
    try {
      const result = await projectScheduleService.updatePhaseSchedule(projectId, phaseData)
      
      if (result.success) {
        showSuccess('일정이 업데이트되었습니다.')
        // refetchProject를 호출하지 않고 로컬 상태만 유지
        return true
      } else {
        showError(result.message)
        return false
      }
    } catch (error) {
      console.error('[useProjectSchedule] Update error:', error)
      showError('일정 업데이트에 실패했습니다.')
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [dispatch])
  
  /**
   * 단계 완료 처리 (후속 일정 자동 조정 포함)
   */
  const completePhase = useCallback(async (projectId, project, phaseKey, navigate) => {
    setIsUpdating(true)
    setUpdateProgress({ phase: phaseKey, status: 'processing' })
    
    try {
      const result = await projectScheduleService.completePhaseWithAdjustment(
        projectId,
        project,
        phaseKey
      )
      
      if (result.success) {
        showSuccess(result.message)
        
        // 조정된 단계들 표시
        if (result.adjustedPhases?.length > 0) {
          setUpdateProgress({
            phase: phaseKey,
            status: 'completed',
            adjustedCount: result.adjustedPhases.length
          })
        }
        
        // refetchProject를 호출하지 않고 Redux 상태만 업데이트
        // 이미 ProjectPhaseBoard에서 Redux 상태를 업데이트했으므로 추가 작업 불필요
        
        // 3초 후 진행 상태 초기화
        setTimeout(() => setUpdateProgress(null), 3000)
        
        return true
      } else {
        showError(result.message)
        setUpdateProgress({ phase: phaseKey, status: 'failed' })
        return false
      }
    } catch (error) {
      console.error('[useProjectSchedule] Complete phase error:', error)
      showError('단계 완료 처리에 실패했습니다.')
      setUpdateProgress({ phase: phaseKey, status: 'failed' })
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [dispatch])
  
  /**
   * 여러 단계 일괄 업데이트
   */
  const bulkUpdatePhases = useCallback(async (projectId, phasesData, navigate) => {
    setIsUpdating(true)
    
    try {
      const result = await projectScheduleService.bulkUpdateSchedule(projectId, phasesData)
      
      if (result.success) {
        showSuccess(`${result.updatedCount}개의 일정이 업데이트되었습니다.`)
        // refetchProject를 호출하지 않고 로컬 상태만 유지
        return true
      } else {
        showError(result.message)
        return false
      }
    } catch (error) {
      console.error('[useProjectSchedule] Bulk update error:', error)
      showError('일정 업데이트에 실패했습니다.')
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [dispatch])
  
  /**
   * 단계 완료 취소
   */
  const uncompletePhase = useCallback(async (projectId, project, phaseKey, navigate) => {
    const phase = project[phaseKey]
    if (!phase) return false
    
    return updatePhase(projectId, {
      phase: phaseKey,
      startDate: phase.start_date,
      endDate: phase.end_date,
      completed: false
    }, navigate)
  }, [updatePhase])
  
  return {
    isUpdating,
    updateProgress,
    updatePhase,
    completePhase,
    uncompletePhase,
    bulkUpdatePhases
  }
}