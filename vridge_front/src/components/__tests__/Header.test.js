import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import Header from '../Header'
import { logout } from '../../store/slices/authSlice'

// Mock dependencies
jest.mock('../../store/slices/authSlice', () => ({
  logout: jest.fn()
}))

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    route: '/',
    query: {},
    asPath: '/'
  })
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
global.localStorage = localStorageMock

// Create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = {
        isLoggedIn: true,
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          profileImage: null
        }
      }) => state,
      notifications: (state = {
        unreadCount: 3,
        notifications: []
      }) => state
    },
    preloadedState: initialState
  })
}

// Wrapper component
const renderWithProviders = (component, { store = createMockStore() } = {}) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  )
}

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders header with logo', () => {
      renderWithProviders(<Header />)
      expect(screen.getByAltText('VideoPlanet Logo')).toBeInTheDocument()
    })

    test('renders user avatar when logged in', () => {
      renderWithProviders(<Header />)
      expect(screen.getByTestId('user-avatar')).toBeInTheDocument()
    })

    test('renders notification icon with badge', () => {
      renderWithProviders(<Header />)
      const notificationButton = screen.getByLabelText('Notifications')
      expect(notificationButton).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument() // Unread count
    })

    test('does not render user menu when not logged in', () => {
      const store = createMockStore({
        auth: { isLoggedIn: false, user: null }
      })
      renderWithProviders(<Header />, { store })
      expect(screen.queryByTestId('user-avatar')).not.toBeInTheDocument()
    })

    test('renders mobile menu button on small screens', () => {
      renderWithProviders(<Header />)
      expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument()
    })
  })

  describe('User Menu', () => {
    test('opens user menu on avatar click', async () => {
      renderWithProviders(<Header />)
      
      const avatar = screen.getByTestId('user-avatar')
      fireEvent.click(avatar)
      
      await waitFor(() => {
        expect(screen.getByText('My Page')).toBeInTheDocument()
        expect(screen.getByText('Settings')).toBeInTheDocument()
        expect(screen.getByText('Logout')).toBeInTheDocument()
      })
    })

    test('closes user menu when clicking outside', async () => {
      renderWithProviders(<Header />)
      
      // Open menu
      fireEvent.click(screen.getByTestId('user-avatar'))
      expect(screen.getByText('My Page')).toBeInTheDocument()
      
      // Click outside
      fireEvent.click(document.body)
      
      await waitFor(() => {
        expect(screen.queryByText('My Page')).not.toBeInTheDocument()
      })
    })

    test('navigates to my page on menu item click', async () => {
      const mockPush = jest.fn()
      jest.spyOn(require('next/router'), 'useRouter').mockReturnValue({
        push: mockPush,
        pathname: '/'
      })
      
      renderWithProviders(<Header />)
      
      fireEvent.click(screen.getByTestId('user-avatar'))
      fireEvent.click(screen.getByText('My Page'))
      
      expect(mockPush).toHaveBeenCalledWith('/mypage')
    })

    test('handles logout', async () => {
      const mockPush = jest.fn()
      jest.spyOn(require('next/router'), 'useRouter').mockReturnValue({
        push: mockPush,
        pathname: '/'
      })
      
      renderWithProviders(<Header />)
      
      fireEvent.click(screen.getByTestId('user-avatar'))
      fireEvent.click(screen.getByText('Logout'))
      
      await waitFor(() => {
        expect(logout).toHaveBeenCalled()
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token')
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('Notifications', () => {
    test('opens notification dropdown on click', async () => {
      renderWithProviders(<Header />)
      
      fireEvent.click(screen.getByLabelText('Notifications'))
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument()
      })
    })

    test('shows notification count', () => {
      renderWithProviders(<Header />)
      const badge = screen.getByTestId('notification-badge')
      expect(badge).toHaveTextContent('3')
    })

    test('hides notification badge when count is 0', () => {
      const store = createMockStore({
        auth: { isLoggedIn: true, user: { id: 1 } },
        notifications: { unreadCount: 0 }
      })
      renderWithProviders(<Header />, { store })
      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument()
    })
  })

  describe('Mobile Menu', () => {
    test('toggles mobile menu', async () => {
      renderWithProviders(<Header />)
      
      const menuButton = screen.getByLabelText('Toggle menu')
      
      // Open menu
      fireEvent.click(menuButton)
      await waitFor(() => {
        expect(screen.getByTestId('mobile-menu')).toHaveClass('mobile-menu-open')
      })
      
      // Close menu
      fireEvent.click(menuButton)
      await waitFor(() => {
        expect(screen.getByTestId('mobile-menu')).toHaveClass('mobile-menu-closed')
      })
    })

    test('closes mobile menu on overlay click', async () => {
      renderWithProviders(<Header />)
      
      // Open menu
      fireEvent.click(screen.getByLabelText('Toggle menu'))
      expect(screen.getByTestId('mobile-menu')).toHaveClass('mobile-menu-open')
      
      // Click overlay
      fireEvent.click(screen.getByTestId('mobile-menu-overlay'))
      
      await waitFor(() => {
        expect(screen.getByTestId('mobile-menu')).toHaveClass('mobile-menu-closed')
      })
    })
  })

  describe('Search', () => {
    test('shows search input on search button click', async () => {
      renderWithProviders(<Header />)
      
      fireEvent.click(screen.getByLabelText('Search'))
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
      })
    })

    test('handles search submission', async () => {
      const mockPush = jest.fn()
      jest.spyOn(require('next/router'), 'useRouter').mockReturnValue({
        push: mockPush,
        pathname: '/'
      })
      
      renderWithProviders(<Header />)
      
      fireEvent.click(screen.getByLabelText('Search'))
      
      const searchInput = screen.getByPlaceholderText('Search...')
      fireEvent.change(searchInput, { target: { value: 'test query' } })
      fireEvent.keyDown(searchInput, { key: 'Enter' })
      
      expect(mockPush).toHaveBeenCalledWith('/search?q=test%20query')
    })

    test('closes search on Escape key', async () => {
      renderWithProviders(<Header />)
      
      fireEvent.click(screen.getByLabelText('Search'))
      const searchInput = screen.getByPlaceholderText('Search...')
      
      fireEvent.keyDown(searchInput, { key: 'Escape' })
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    test('has correct ARIA labels', () => {
      renderWithProviders(<Header />)
      
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument()
      expect(screen.getByLabelText('User menu')).toBeInTheDocument()
    })

    test('supports keyboard navigation', async () => {
      renderWithProviders(<Header />)
      
      const avatar = screen.getByTestId('user-avatar')
      avatar.focus()
      
      fireEvent.keyDown(avatar, { key: 'Enter' })
      
      await waitFor(() => {
        expect(screen.getByText('My Page')).toBeInTheDocument()
      })
    })

    test('announces notification count to screen readers', () => {
      renderWithProviders(<Header />)
      
      const notificationButton = screen.getByLabelText('Notifications')
      expect(notificationButton).toHaveAttribute('aria-label', 'Notifications (3 unread)')
    })
  })

  describe('Theme Toggle', () => {
    test('toggles theme on button click', () => {
      renderWithProviders(<Header />)
      
      const themeToggle = screen.getByLabelText('Toggle theme')
      
      // Initial state (light theme)
      expect(document.documentElement).not.toHaveClass('dark')
      
      // Toggle to dark
      fireEvent.click(themeToggle)
      expect(document.documentElement).toHaveClass('dark')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
      
      // Toggle back to light
      fireEvent.click(themeToggle)
      expect(document.documentElement).not.toHaveClass('dark')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')
    })
  })

  describe('Responsive Behavior', () => {
    test('hides certain elements on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      renderWithProviders(<Header />)
      
      expect(screen.queryByTestId('desktop-search')).not.toBeInTheDocument()
      expect(screen.getByTestId('mobile-menu-button')).toBeInTheDocument()
    })
  })
})