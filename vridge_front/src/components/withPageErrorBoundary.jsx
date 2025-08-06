import React from 'react'
import { PageErrorBoundary } from './ErrorBoundary'

export default function withPageErrorBoundary(Component, pageName) {
  return function WithPageErrorBoundaryComponent(props) {
    return (
      <PageErrorBoundary pageName={pageName}>
        <Component {...props} />
      </PageErrorBoundary>
    )
  }
}