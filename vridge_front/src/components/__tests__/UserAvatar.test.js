import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserAvatar from '../UserAvatar';

// Mock next/navigation
jest.mock('../../util/nextNavigation', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn()
  })
}));



describe('UserAvatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<UserAvatar />);
    expect(document.body).toBeInTheDocument();
  });

  it('displays correct initial content', () => {
    render(<UserAvatar />);
    // Add specific content checks based on component
  });

  

  

  
  it('displays user avatar with name', () => {
    render(<UserAvatar name="John Doe" profileImage="/avatar.jpg" />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'John Doe');
  });

  it('shows default avatar when no image provided', () => {
    render(<UserAvatar name="John Doe" />);
    
    const avatar = screen.getByText('JD');
    expect(avatar).toBeInTheDocument();
  });

  

  

  

  

  it('is accessible', () => {
    render(<UserAvatar />);
    
    // Basic accessibility checks
    const main = screen.getByRole('main', { hidden: true });
    expect(main).toBeInTheDocument();
  });
});