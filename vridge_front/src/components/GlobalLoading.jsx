import React from 'react'
import { useSelector } from 'react-redux'
import UnifiedLoading from './UnifiedLoading'

export default function GlobalLoading() {
  const { isGlobalLoading, loadingMessage, loadingVariant } = useSelector(state => state.loading)
  
  if (!isGlobalLoading) {
    return null
  }
  
  return <UnifiedLoading message={loadingMessage} variant={loadingVariant} fullScreen={true} />
}