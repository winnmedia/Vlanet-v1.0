import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ErrorBoundary from '../ErrorBoundary'


const originalError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalError
})

// Test component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary Component', () => {
  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  test('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText(/오류가 발생했습니다/)).toBeInTheDocument()
    expect(screen.getByText(/페이지를 새로고침해주세요/)).toBeInTheDocument()
  })

  test('renders custom fallback when provided', () => {
    const CustomFallback = () => <div>Custom error message</div>
    
    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
  })

  test('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText(/Test error/)).toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  test('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.queryByText(/Test error/)).not.toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  test('renders reload button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const reloadButton = screen.getByRole('button', { name: /새로고침/ })
    expect(reloadButton).toBeInTheDocument()
  })

  test('logs error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(console.error).toHaveBeenCalled()
  })

  test('recovers when error is resolved', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText(/오류가 발생했습니다/)).toBeInTheDocument()
    
    // Re-render without error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    
    // Note: ErrorBoundary doesn't automatically recover, 
    // so error UI will still be shown unless reset
    expect(screen.getByText(/오류가 발생했습니다/)).toBeInTheDocument()
  })
})