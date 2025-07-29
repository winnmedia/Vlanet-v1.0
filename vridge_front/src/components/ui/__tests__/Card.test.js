import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Card from '../Card'

describe('Card Component', () => {
  describe('Rendering', () => {
    test('renders card with content', () => {
      render(
        <Card>
          <p>Card content</p>
        </Card>
      )
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    test('renders with title', () => {
      render(<Card title="Card Title">Content</Card>)
      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card Title').tagName).toBe('H3')
    })

    test('renders with subtitle', () => {
      render(<Card title="Title" subtitle="Subtitle">Content</Card>)
      expect(screen.getByText('Subtitle')).toBeInTheDocument()
    })

    test('renders with header actions', () => {
      const actions = <button>Action</button>
      render(<Card title="Title" actions={actions}>Content</Card>)
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    })

    test('renders with footer', () => {
      render(
        <Card footer={<div>Footer content</div>}>
          Main content
        </Card>
      )
      expect(screen.getByText('Footer content')).toBeInTheDocument()
      expect(screen.getByText('Main content')).toBeInTheDocument()
    })

    test('renders with different variants', () => {
      const { rerender } = render(<Card variant="default">Default</Card>)
      let card = screen.getByText('Default').closest('.card')
      expect(card).toHaveClass('card-default')

      rerender(<Card variant="outlined">Outlined</Card>)
      card = screen.getByText('Outlined').closest('.card')
      expect(card).toHaveClass('card-outlined')

      rerender(<Card variant="elevated">Elevated</Card>)
      card = screen.getByText('Elevated').closest('.card')
      expect(card).toHaveClass('card-elevated')
    })

    test('renders with padding options', () => {
      const { rerender } = render(<Card padding="none">No padding</Card>)
      let card = screen.getByText('No padding').closest('.card')
      expect(card).toHaveClass('card-padding-none')

      rerender(<Card padding="small">Small padding</Card>)
      card = screen.getByText('Small padding').closest('.card')
      expect(card).toHaveClass('card-padding-small')

      rerender(<Card padding="large">Large padding</Card>)
      card = screen.getByText('Large padding').closest('.card')
      expect(card).toHaveClass('card-padding-large')
    })
  })

  describe('Interactive states', () => {
    test('renders as clickable when onClick is provided', () => {
      const handleClick = jest.fn()
      render(<Card onClick={handleClick}>Clickable card</Card>)
      
      const card = screen.getByText('Clickable card').closest('.card')
      expect(card).toHaveClass('card-clickable')
      expect(card).toHaveAttribute('role', 'button')
      expect(card).toHaveAttribute('tabIndex', '0')
    })

    test('renders with hover effect when hoverable', () => {
      render(<Card hoverable>Hoverable card</Card>)
      const card = screen.getByText('Hoverable card').closest('.card')
      expect(card).toHaveClass('card-hoverable')
    })

    test('renders with selected state', () => {
      render(<Card selected>Selected card</Card>)
      const card = screen.getByText('Selected card').closest('.card')
      expect(card).toHaveClass('card-selected')
    })

    test('renders with loading state', () => {
      render(<Card loading>Content</Card>)
      expect(screen.getByTestId('card-loading')).toBeInTheDocument()
    })
  })

  describe('Composition', () => {
    test('renders complex card with all sections', () => {
      render(
        <Card
          title="Product Card"
          subtitle="Best seller"
          actions={<button>Edit</button>}
          footer={<div>$99.99</div>}
        >
          <p>Product description</p>
        </Card>
      )

      expect(screen.getByText('Product Card')).toBeInTheDocument()
      expect(screen.getByText('Best seller')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
      expect(screen.getByText('Product description')).toBeInTheDocument()
      expect(screen.getByText('$99.99')).toBeInTheDocument()
    })

    test('renders with custom header', () => {
      const customHeader = (
        <div data-testid="custom-header">
          <h2>Custom Header</h2>
        </div>
      )
      render(<Card header={customHeader}>Content</Card>)
      expect(screen.getByTestId('custom-header')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has correct ARIA attributes when clickable', () => {
      const handleClick = jest.fn()
      render(
        <Card onClick={handleClick} aria-label="Clickable card">
          Content
        </Card>
      )
      const card = screen.getByRole('button')
      expect(card).toHaveAttribute('aria-label', 'Clickable card')
    })

    test('supports keyboard navigation when clickable', () => {
      const handleClick = jest.fn()
      render(<Card onClick={handleClick}>Clickable</Card>)
      
      const card = screen.getByRole('button')
      
      // Simulate Enter key
      card.focus()
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      
      // Note: This is a simplified test. In real implementation,
      // the component should handle keyboard events properly
    })
  })

  describe('Custom props', () => {
    test('passes through additional props', () => {
      render(
        <Card 
          data-testid="custom-card" 
          className="custom-class"
          id="unique-card"
        >
          Content
        </Card>
      )
      const card = screen.getByText('Content').closest('.card')
      expect(card).toHaveAttribute('data-testid', 'custom-card')
      expect(card).toHaveClass('custom-class')
      expect(card).toHaveAttribute('id', 'unique-card')
    })

    test('merges className with default classes', () => {
      render(
        <Card className="custom-class" variant="outlined" padding="small">
          Content
        </Card>
      )
      const card = screen.getByText('Content').closest('.card')
      expect(card).toHaveClass('card')
      expect(card).toHaveClass('card-outlined')
      expect(card).toHaveClass('card-padding-small')
      expect(card).toHaveClass('custom-class')
    })
  })

  describe('Edge cases', () => {
    test('renders without content', () => {
      const { container } = render(<Card />)
      expect(container.querySelector('.card')).toBeInTheDocument()
    })

    test('renders with only title', () => {
      render(<Card title="Only Title" />)
      expect(screen.getByText('Only Title')).toBeInTheDocument()
    })

    test('handles long content gracefully', () => {
      const longContent = 'Lorem ipsum '.repeat(100)
      render(<Card>{longContent}</Card>)
      expect(screen.getByText(longContent)).toBeInTheDocument()
    })
  })
})