import React from 'react'
import dynamic from 'next/dynamic';;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { BrowserRouter } from 'react-router-dom'
const EmailCheck = dynamic(() => import('../EmailCheck'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});;
;

jest.mock('../../../util/nextNavigation', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn()
  })
}));

const mockStore = createStore(() => ({
  ProjectStore: {
    user: { id: 1, name: 'Test User' },
    project_list: []
  }
}));

const renderWithProviders = (component) => render(
  <Provider store={mockStore}>
    <BrowserRouter>{component}</BrowserRouter>
  </Provider>
);

describe('EmailCheck', () => {
  it('renders without crashing', () => {
    renderWithProviders(<EmailCheck />);
    expect(document.body).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithProviders(<EmailCheck />);
    const mainElement = screen.getByRole('main', { hidden: true });
    expect(mainElement).toBeInTheDocument();
  });

  

  
});