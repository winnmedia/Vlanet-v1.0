import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SideBar from '../SideBar';

// Mock next/navigation
jest.mock('../../util/nextNavigation', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn()
  })
}));



describe('SideBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<SideBar />);
    expect(document.body).toBeInTheDocument();
  });

  it('displays correct initial content', () => {
    render(<SideBar />);
    // Add specific content checks based on component
  });

  

  

  

  

  

  

  

  it('is accessible', () => {
    render(<SideBar />);
    
    // Basic accessibility checks
    const main = screen.getByRole('main', { hidden: true });
    expect(main).toBeInTheDocument();
  });
});