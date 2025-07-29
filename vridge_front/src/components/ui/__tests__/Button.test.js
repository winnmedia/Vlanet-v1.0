import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Button from '../Button'

describe('Button Component', () => {
  describe('Rendering', () => {
    test('renders button with text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button')).toHaveTextContent('Click me')
    })

    test('renders with different variants', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>)
      expect(screen.getByRole('button')).toHaveClass('btn-primary')

      rerender(<Button variant="secondary">Secondary</Button>)
      expect(screen.getByRole('button')).toHaveClass('btn-secondary')

      rerender(<Button variant="danger">Danger</Button>)
      expect(screen.getByRole('button')).toHaveClass('btn-danger')
    })

    test('renders with different sizes', () => {
      const { rerender } = render(<Button size="small">Small</Button>)
      expect(screen.getByRole('button')).toHaveClass('btn-sm')

      rerender(<Button size="medium">Medium</Button>)
      expect(screen.getByRole('button')).toHaveClass('btn-md')

      rerender(<Button size="large">Large</Button>)
      expect(screen.getByRole('button')).toHaveClass('btn-lg')
    })

    test('renders with icon', () => {
      const Icon = () => <span data-testid="icon">🚀</span>
      render(<Button icon={<Icon />}>With Icon</Button>)
      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    test('renders as full width', () => {
      render(<Button fullWidth>Full Width</Button>)
      expect(screen.getByRole('button')).toHaveClass('btn-full-width')
    })

    test('renders with loading state', () => {
      render(<Button loading>Loading</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('btn-loading')
      expect(button).toBeDisabled()
    })
  })

  describe('Interactions', () => {
    test('handles click events', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    test('does not fire click when disabled', () => {
      const handleClick = jest.fn()
      render(<Button disabled onClick={handleClick}>Disabled</Button>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })

    test('does not fire click when loading', () => {
      const handleClick = jest.fn()
      render(<Button loading onClick={handleClick}>Loading</Button>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    test('has correct ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled Button</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
    })

    test('has correct ARIA attributes when loading', () => {
      render(<Button loading>Loading Button</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
    })

    test('supports custom aria-label', () => {
      render(<Button aria-label="Custom label">Button</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom label')
    })
  })

  describe('Type prop', () => {
    test('renders as button type by default', () => {
      render(<Button>Default</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    test('renders as submit type when specified', () => {
      render(<Button type="submit">Submit</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    test('renders as reset type when specified', () => {
      render(<Button type="reset">Reset</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset')
    })
  })

  describe('Custom props', () => {
    test('passes through additional props', () => {
      render(<Button data-testid="custom-button" className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-testid', 'custom-button')
      expect(button).toHaveClass('custom-class')
    })

    test('merges className with default classes', () => {
      render(<Button className="custom-class" variant="primary">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('btn')
      expect(button).toHaveClass('btn-primary')
      expect(button).toHaveClass('custom-class')
    })
  })
})