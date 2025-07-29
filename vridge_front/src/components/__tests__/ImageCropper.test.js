import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import ImageCropper from '../ImageCropper';

jest.mock('../../util/nextNavigation', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn()
  })
}));



describe('ImageCropper', () => {
  it('renders without crashing', () => {
    render(<ImageCropper />);
    expect(document.body).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ImageCropper />);
    const mainElement = screen.getByRole('main', { hidden: true });
    expect(mainElement).toBeInTheDocument();
  });

  

  
});