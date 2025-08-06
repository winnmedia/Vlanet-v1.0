import { useState, useMemo } from 'react'
import { message } from 'antd'

export const useFeedbackFilter = (feedbacks = []) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, timeAsc, timeDesc

  const filteredFeedbacks = useMemo(() => {
    let filtered = feedbacks.filter(feedback => {
      // 검색어 필터
      const matchesSearch = !searchTerm || 
        feedback.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.contents?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      // 상태 필터
      const matchesStatus = statusFilter === 'all' || 
        (feedback.status || 'pending') === statusFilter
      
      return matchesSearch && matchesStatus
    })

    // 정렬
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created) - new Date(b.created))
        break
      case 'timeAsc':
        filtered.sort((a, b) => {
          if (!a.time_at) return 1
          if (!b.time_at) return -1
          return a.time_at.localeCompare(b.time_at)
        })
        break
      case 'timeDesc':
        filtered.sort((a, b) => {
          if (!a.time_at) return 1
          if (!b.time_at) return -1
          return b.time_at.localeCompare(a.time_at)
        })
        break
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created) - new Date(a.created))
        break
    }

    return filtered
  }, [feedbacks, searchTerm, statusFilter, sortBy])

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setSortBy('newest')
  }

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    filteredFeedbacks,
    resetFilters,
    totalCount: feedbacks.length,
    filteredCount: filteredFeedbacks.length
  }
}