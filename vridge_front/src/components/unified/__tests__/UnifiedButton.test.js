import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UnifiedButton } from '../UnifiedButton';

describe('UnifiedButton', () => {
  it('renders button with children', () => {
    render(<UnifiedButton>Click me</UnifiedButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies correct variant class', () => {
    render(<UnifiedButton variant="primary">Primary Button</UnifiedButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('primary');
  });

  it('applies correct size class', () => {
    render(<UnifiedButton size="large">Large Button</UnifiedButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('size-large');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<UnifiedButton onClick={handleClick}>Click me</UnifiedButton>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(<UnifiedButton disabled>Disabled Button</UnifiedButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('shows loading state', () => {
    render(<UnifiedButton loading>Loading</UnifiedButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('loading');
    expect(button).toBeDisabled();
  });

  it('renders with icon', () => {
    const icon = <span data-testid="icon">🎯</span>;
    render(<UnifiedButton icon={icon}>With Icon</UnifiedButton>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies fullWidth class when fullWidth is true', () => {
    render(<UnifiedButton fullWidth>Full Width</UnifiedButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('fullWidth');
  });

  it('applies custom className', () => {
    render(<UnifiedButton className="custom-class">Custom</UnifiedButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('renders different button types', () => {
    render(<UnifiedButton type="submit">Submit</UnifiedButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });
});