import React from 'react'
import { useSelector } from 'react-redux'
import LoadingAnimationV2 from './LoadingAnimation-v2'

export default function GlobalLoading() {
  const { isGlobalLoading, loadingMessage, loadingVariant } = useSelector(state => state.loading)
  
  if (!isGlobalLoading) {
    return null
  }
  
  return <LoadingAnimationV2 message={loadingMessage} variant={loadingVariant} />
}