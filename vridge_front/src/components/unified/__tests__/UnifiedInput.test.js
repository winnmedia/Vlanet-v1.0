import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UnifiedInput } from '../UnifiedInput';

describe('UnifiedInput', () => {
  it('renders input with placeholder', () => {
    render(<UnifiedInput placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<UnifiedInput label="Username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<UnifiedInput onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('applies correct size class', () => {
    render(<UnifiedInput size="large" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('size-large');
  });

  it('shows error state', () => {
    render(<UnifiedInput error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('error');
  });

  it('disables input when disabled prop is true', () => {
    render(<UnifiedInput disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('renders different input types', () => {
    render(<UnifiedInput type="email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('shows required indicator', () => {
    render(<UnifiedInput label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders with prefix', () => {
    render(<UnifiedInput prefix="$" />);
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('renders with suffix', () => {
    render(<UnifiedInput suffix=".com" />);
    expect(screen.getByText('.com')).toBeInTheDocument();
  });

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(<UnifiedInput onFocus={handleFocus} onBlur={handleBlur} />);
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalled();
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalled();
  });
});