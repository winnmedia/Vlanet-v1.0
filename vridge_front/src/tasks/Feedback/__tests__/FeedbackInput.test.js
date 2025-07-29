import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import FeedbackInput from '../FeedbackInput';

jest.mock('../../../util/nextNavigation', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn()
  })
}));



describe('FeedbackInput', () => {
  it('renders without crashing', () => {
    render(<FeedbackInput />);
    expect(document.body).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<FeedbackInput />);
    const mainElement = screen.getByRole('main', { hidden: true });
    expect(mainElement).toBeInTheDocument();
  });

  
  it('handles form submission', async () => {
    const handleSubmit = jest.fn();
    render(<FeedbackInput onSubmit={handleSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /submit|save|확인/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  
});