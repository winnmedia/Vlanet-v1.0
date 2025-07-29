import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import ExportModal from '../ExportModal';

jest.mock('../../util/nextNavigation', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn()
  })
}));



describe('ExportModal', () => {
  it('renders without crashing', () => {
    render(<ExportModal />);
    expect(document.body).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ExportModal />);
    const mainElement = screen.getByRole('main', { hidden: true });
    expect(mainElement).toBeInTheDocument();
  });

  

  
  it('opens and closes modal', () => {
    const handleClose = jest.fn();
    render(<ExportModal isOpen={true} onClose={handleClose} />);
    
    const closeButton = screen.getByLabelText(/close|닫기/i);
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalled();
  });
});