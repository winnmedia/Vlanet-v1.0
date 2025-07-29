import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import VideoUploadGuide from '../VideoUploadGuide';

jest.mock('../../util/nextNavigation', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn()
  })
}));



describe('VideoUploadGuide', () => {
  it('renders without crashing', () => {
    render(<VideoUploadGuide />);
    expect(document.body).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<VideoUploadGuide />);
    const mainElement = screen.getByRole('main', { hidden: true });
    expect(mainElement).toBeInTheDocument();
  });

  

  
});