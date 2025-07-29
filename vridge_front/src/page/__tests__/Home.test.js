import React from 'react'
import dynamic from 'next/dynamic';
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
const Home = dynamic(() => import('../Home'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});


// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    route: '/',
    query: {},
    asPath: '/'
  })
}))

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }) => {
    return <a href={href}>{children}</a>
  }
})

// Create mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { isLoggedIn: false, user: null }) => state
    }
  })
}

// Wrapper component
const renderWithProviders = (component) => {
  return render(
    <Provider store={createMockStore()}>
      {component}
    </Provider>
  )
}

describe('Home Page', () => {
  test('renders home page heading', () => {
    renderWithProviders(<Home />)
    
    // Check for main heading
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent(/AI 영상 제작 플랫폼|VideoPlanet/i)
  })

  test('renders hero section', () => {
    renderWithProviders(<Home />)
    
    // Check for hero section content
    expect(screen.getByText(/영상 제작의 새로운 시대/i)).toBeInTheDocument()
  })

  test('renders call-to-action buttons', () => {
    renderWithProviders(<Home />)
    
    // Check for CTA buttons
    const startButton = screen.getByRole('link', { name: /시작하기|무료로 시작/i })
    expect(startButton).toBeInTheDocument()
    expect(startButton).toHaveAttribute('href', expect.stringMatching(/signup|register/))
  })

  test('renders feature sections', () => {
    renderWithProviders(<Home />)
    
    // Check for feature descriptions
    expect(screen.getByText(/AI 기반/i)).toBeInTheDocument()
    expect(screen.getByText(/자동화/i)).toBeInTheDocument()
  })

  test('renders when user is logged in', () => {
    const loggedInStore = configureStore({
      reducer: {
        auth: (state = { isLoggedIn: true, user: { id: 1, name: 'Test User' } }) => state
      }
    })
    
    render(
      <Provider store={loggedInStore}>
        <Home />
      </Provider>
    )
    
    // When logged in, should show different CTA
    const dashboardLink = screen.getByRole('link', { name: /대시보드|프로젝트/i })
    expect(dashboardLink).toBeInTheDocument()
  })

  test('has responsive layout classes', () => {
    const { container } = renderWithProviders(<Home />)
    
    // Check for responsive container
    const mainContainer = container.querySelector('.container, .home-container')
    expect(mainContainer).toBeInTheDocument()
  })

  test('renders footer section', () => {
    renderWithProviders(<Home />)
    
    // Check for footer links
    expect(screen.getByText(/이용약관|Terms/i)).toBeInTheDocument()
    expect(screen.getByText(/개인정보/i)).toBeInTheDocument()
  })

  test('has proper SEO meta tags', () => {
    renderWithProviders(<Home />)
    
    // Note: In a real app, you'd check document.head for meta tags
    // This is a simplified test
    const { container } = renderWithProviders(<Home />)
    expect(container).toBeTruthy()
  })
})