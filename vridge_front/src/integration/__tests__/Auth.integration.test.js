import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Login from '../../page/User/Login';
import Signup from '../../page/User/Signup';
import { checkSession } from '../../util/util';

jest.mock('../../util/util');
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

const mockStore = configureStore({
  reducer: {
    ProjectStore: () => ({})
  }
});

describe('Authentication Flow Integration Tests', () => {
  test('login flow', async () => {
    checkSession.mockReturnValue(false);
    
    render(
      <Provider store={mockStore}>
        <Login />
      </Provider>
    );
    
    const emailInput = screen.getByPlaceholderText(/이메일/i);
    const passwordInput = screen.getByPlaceholderText(/비밀번호/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    const loginButton = screen.getByText(/로그인/i);
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(checkSession).toHaveBeenCalled();
    });
  });

  test('signup validation', async () => {
    render(
      <Provider store={mockStore}>
        <Signup />
      </Provider>
    );
    
    const submitButton = screen.getByText(/가입하기/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/필수 항목/i)).toBeInTheDocument();
    });
  });
});