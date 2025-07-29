import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MinimalButton } from '../MinimalButton'

describe('MinimalButton Component', () => {
  describe('Rendering', () => {
    test('renders button with text', () => {
      render(<MinimalButton>Click me</MinimalButton>)
      expect(screen.getByRole('button')).toHaveTextContent('Click me')
    })

    test('renders with primary variant by default', () => {
      render(<MinimalButton>Primary</MinimalButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('minimal-btn')
      expect(button).toHaveClass('minimal-btn-primary')
    })

    test('renders with secondary variant', () => {
      render(<MinimalButton variant="secondary">Secondary</MinimalButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('minimal-btn-secondary')
    })

    test('renders with different sizes', () => {
      const { rerender } = render(<MinimalButton size="small">Small</MinimalButton>)
      expect(screen.getByRole('button')).toHaveClass('minimal-btn-sm')

      rerender(<MinimalButton size="medium">Medium</MinimalButton>)
      expect(screen.getByRole('button')).toHaveClass('minimal-btn-md')

      rerender(<MinimalButton size="large">Large</MinimalButton>)
      expect(screen.getByRole('button')).toHaveClass('minimal-btn-lg')
    })

    test('renders full width button', () => {
      render(<MinimalButton fullWidth>Full Width</MinimalButton>)
      expect(screen.getByRole('button')).toHaveClass('minimal-btn-full-width')
    })

    test('renders with loading state', () => {
      render(<MinimalButton loading>Loading</MinimalButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('minimal-btn-loading')
      expect(button).toBeDisabled()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    test('renders with icon', () => {
      const Icon = () => <span data-testid="test-icon">🚀</span>
      render(<MinimalButton icon={<Icon />}>With Icon</MinimalButton>)
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    test('renders disabled button', () => {
      render(<MinimalButton disabled>Disabled</MinimalButton>)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('Interactions', () => {
    test('handles click events', () => {
      const handleClick = jest.fn()
      render(<MinimalButton onClick={handleClick}>Click me</MinimalButton>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    test('does not fire click when disabled', () => {
      const handleClick = jest.fn()
      render(<MinimalButton disabled onClick={handleClick}>Disabled</MinimalButton>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })

    test('does not fire click when loading', () => {
      const handleClick = jest.fn()
      render(<MinimalButton loading onClick={handleClick}>Loading</MinimalButton>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Type prop', () => {
    test('renders as button type by default', () => {
      render(<MinimalButton>Default</MinimalButton>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    test('renders as submit type when specified', () => {
      render(<MinimalButton type="submit">Submit</MinimalButton>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })
  })

  describe('Custom props', () => {
    test('passes through additional props', () => {
      render(
        <MinimalButton 
          data-testid="custom-button" 
          className="custom-class"
          id="test-button"
        >
          Custom
        </MinimalButton>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-testid', 'custom-button')
      expect(button).toHaveClass('custom-class')
      expect(button).toHaveAttribute('id', 'test-button')
    })
  })

  describe('Accessibility', () => {
    test('supports aria-label', () => {
      render(<MinimalButton aria-label="Custom label">Button</MinimalButton>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom label')
    })

    test('has aria-disabled when disabled', () => {
      render(<MinimalButton disabled>Disabled</MinimalButton>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
    })

    test('has aria-busy when loading', () => {
      render(<MinimalButton loading>Loading</MinimalButton>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
    })
  })
})