import React from 'react'
import dynamic from 'next/dynamic';
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'


import { showAlert } from '../../../components/CustomAlert'
const axios = dynamic(() => import('../../../config/axios'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const Login = dynamic(() => import('../Login'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

// Mock dependencies
jest.mock('../../../config/axios')
jest.mock('../../../components/CustomAlert', () => ({
  showAlert: jest.fn()
}))

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/login',
    query: {}
  })
}))

// Create mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = {
        isLoggedIn: false,
        user: null
      }) => state
    }
  })
}

// Wrapper component
const renderWithProviders = (component) => {
  return render(
    <Provider store={createMockStore()}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  )
}

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders login form', () => {
      renderWithProviders(<Login />)
      
      expect(screen.getByText('로그인')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('이메일')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('비밀번호')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
    })

    test('renders social login buttons', () => {
      renderWithProviders(<Login />)
      
      expect(screen.getByText('Google로 로그인')).toBeInTheDocument()
      expect(screen.getByText('Kakao로 로그인')).toBeInTheDocument()
    })

    test('renders remember me checkbox', () => {
      renderWithProviders(<Login />)
      
      expect(screen.getByLabelText('로그인 상태 유지')).toBeInTheDocument()
    })

    test('renders forgot password link', () => {
      renderWithProviders(<Login />)
      
      expect(screen.getByText('비밀번호를 잊으셨나요?')).toBeInTheDocument()
    })

    test('renders signup link', () => {
      renderWithProviders(<Login />)
      
      expect(screen.getByText('회원가입')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    test('shows error for empty email', async () => {
      renderWithProviders(<Login />)
      
      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(showAlert).toHaveBeenCalledWith('warning', '이메일을 입력해주세요.')
      })
    })

    test('shows error for invalid email format', async () => {
      renderWithProviders(<Login />)
      
      const emailInput = screen.getByPlaceholderText('이메일')
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      
      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(showAlert).toHaveBeenCalledWith('warning', '올바른 이메일 형식을 입력해주세요.')
      })
    })

    test('shows error for empty password', async () => {
      renderWithProviders(<Login />)
      
      const emailInput = screen.getByPlaceholderText('이메일')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      
      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(showAlert).toHaveBeenCalledWith('warning', '비밀번호를 입력해주세요.')
      })
    })

    test('shows error for short password', async () => {
      renderWithProviders(<Login />)
      
      const emailInput = screen.getByPlaceholderText('이메일')
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: '123' } })
      
      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(showAlert).toHaveBeenCalledWith('warning', '비밀번호는 최소 6자 이상이어야 합니다.')
      })
    })
  })

  describe('Login Process', () => {
    test('successfully logs in user', async () => {
      const mockPush = jest.fn()
      jest.spyOn(require('next/router'), 'useRouter').mockReturnValue({
        push: mockPush,
        pathname: '/login',
        query: {}
      })
      
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            access_token: 'test-token',
            user: {
              id: 1,
              email: 'test@example.com',
              name: 'Test User'
            }
          }
        }
      })
      
      renderWithProviders(<Login />)
      
      const emailInput = screen.getByPlaceholderText('이메일')
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/users/signin/', {
          email: 'test@example.com',
          password: 'password123'
        })
        expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'test-token')
        expect(showAlert).toHaveBeenCalledWith('success', '로그인되었습니다.')
        expect(mockPush).toHaveBeenCalledWith('/cms')
      })
    })

    test('handles login failure', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            message: '이메일 또는 비밀번호가 올바르지 않습니다.'
          }
        }
      })
      
      renderWithProviders(<Login />)
      
      const emailInput = screen.getByPlaceholderText('이메일')
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      
      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(showAlert).toHaveBeenCalledWith('error', '이메일 또는 비밀번호가 올바르지 않습니다.')
      })
    })

    test('shows loading state during login', async () => {
      axios.post.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      renderWithProviders(<Login />)
      
      const emailInput = screen.getByPlaceholderText('이메일')
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)
      
      expect(submitButton).toBeDisabled()
      expect(screen.getByText('로그인 중...')).toBeInTheDocument()
    })
  })

  describe('Remember Me', () => {
    test('saves email when remember me is checked', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            access_token: 'test-token',
            user: { id: 1 }
          }
        }
      })
      
      renderWithProviders(<Login />)
      
      const emailInput = screen.getByPlaceholderText('이메일')
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      const rememberMe = screen.getByLabelText('로그인 상태 유지')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(rememberMe)
      
      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('rememberedEmail', 'test@example.com')
      })
    })

    test('loads remembered email on mount', () => {
      localStorage.getItem.mockReturnValueOnce('remembered@example.com')
      
      renderWithProviders(<Login />)
      
      const emailInput = screen.getByPlaceholderText('이메일')
      expect(emailInput).toHaveValue('remembered@example.com')
      expect(screen.getByLabelText('로그인 상태 유지')).toBeChecked()
    })
  })

  describe('Password Visibility Toggle', () => {
    test('toggles password visibility', () => {
      renderWithProviders(<Login />)
      
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      const toggleButton = screen.getByLabelText('비밀번호 표시')
      
      // Initially password type
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Toggle to show
      fireEvent.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      // Toggle back to hide
      fireEvent.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Social Login', () => {
    test('initiates Google login', () => {
      const mockOpen = jest.fn()
      global.window.open = mockOpen
      
      renderWithProviders(<Login />)
      
      const googleButton = screen.getByText('Google로 로그인')
      fireEvent.click(googleButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/google'),
        expect.any(String)
      )
    })

    test('initiates Kakao login', () => {
      const mockOpen = jest.fn()
      global.window.open = mockOpen
      
      renderWithProviders(<Login />)
      
      const kakaoButton = screen.getByText('Kakao로 로그인')
      fireEvent.click(kakaoButton)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/kakao'),
        expect.any(String)
      )
    })
  })

  describe('Navigation', () => {
    test('navigates to signup page', () => {
      const mockPush = jest.fn()
      jest.spyOn(require('next/router'), 'useRouter').mockReturnValue({
        push: mockPush,
        pathname: '/login'
      })
      
      renderWithProviders(<Login />)
      
      const signupLink = screen.getByText('회원가입')
      fireEvent.click(signupLink)
      
      expect(mockPush).toHaveBeenCalledWith('/signup')
    })

    test('navigates to forgot password page', () => {
      const mockPush = jest.fn()
      jest.spyOn(require('next/router'), 'useRouter').mockReturnValue({
        push: mockPush,
        pathname: '/login'
      })
      
      renderWithProviders(<Login />)
      
      const forgotLink = screen.getByText('비밀번호를 잊으셨나요?')
      fireEvent.click(forgotLink)
      
      expect(mockPush).toHaveBeenCalledWith('/forgot-password')
    })
  })

  describe('Accessibility', () => {
    test('has correct form labels', () => {
      renderWithProviders(<Login />)
      
      expect(screen.getByLabelText('이메일')).toBeInTheDocument()
      expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    })

    test('supports keyboard submission', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            access_token: 'test-token',
            user: { id: 1 }
          }
        }
      })
      
      renderWithProviders(<Login />)
      
      const emailInput = screen.getByPlaceholderText('이메일')
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      // Submit with Enter key
      fireEvent.keyDown(passwordInput, { key: 'Enter' })
      
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled()
      })
    })
  })
})