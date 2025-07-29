import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import ProjectForm from '../ProjectForm';

jest.mock('../../util/nextNavigation', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn()
  })
}));



describe('ProjectForm', () => {
  it('renders without crashing', () => {
    render(<ProjectForm />);
    expect(document.body).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ProjectForm />);
    const mainElement = screen.getByRole('main', { hidden: true });
    expect(mainElement).toBeInTheDocument();
  });

  
  it('handles form submission', async () => {
    const handleSubmit = jest.fn();
    render(<ProjectForm onSubmit={handleSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /submit|save|확인/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  
});