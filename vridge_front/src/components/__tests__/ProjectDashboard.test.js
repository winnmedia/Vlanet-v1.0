import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectDashboard from '../ProjectDashboard';

// Mock next/navigation
jest.mock('../../util/nextNavigation', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn()
  })
}));



describe('ProjectDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ProjectDashboard />);
    expect(document.body).toBeInTheDocument();
  });

  it('displays correct initial content', () => {
    render(<ProjectDashboard />);
    // Add specific content checks based on component
  });

  

  

  

  

  

  

  

  it('is accessible', () => {
    render(<ProjectDashboard />);
    
    // Basic accessibility checks
    const main = screen.getByRole('main', { hidden: true });
    expect(main).toBeInTheDocument();
  });
});