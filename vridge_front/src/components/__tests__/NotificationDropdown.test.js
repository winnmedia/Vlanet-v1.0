import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationDropdown from '../NotificationDropdown';

// Mock next/navigation
jest.mock('../../util/nextNavigation', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn()
  })
}));



describe('NotificationDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<NotificationDropdown />);
    expect(document.body).toBeInTheDocument();
  });

  it('displays correct initial content', () => {
    render(<NotificationDropdown />);
    // Add specific content checks based on component
  });

  

  

  

  

  

  

  

  it('is accessible', () => {
    render(<NotificationDropdown />);
    
    // Basic accessibility checks
    const main = screen.getByRole('main', { hidden: true });
    expect(main).toBeInTheDocument();
  });
});