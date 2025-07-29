import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectPhaseBoard from '../ProjectPhaseBoard';

// Mock next/navigation
jest.mock('../../util/nextNavigation', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn()
  })
}));



describe('ProjectPhaseBoard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ProjectPhaseBoard />);
    expect(document.body).toBeInTheDocument();
  });

  it('displays correct initial content', () => {
    render(<ProjectPhaseBoard />);
    // Add specific content checks based on component
  });

  

  

  

  

  

  

  

  it('is accessible', () => {
    render(<ProjectPhaseBoard />);
    
    // Basic accessibility checks
    const main = screen.getByRole('main', { hidden: true });
    expect(main).toBeInTheDocument();
  });
});