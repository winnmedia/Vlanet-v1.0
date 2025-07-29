import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MinimalCard } from '../MinimalCard'

describe('MinimalCard Component', () => {
  describe('Rendering', () => {
    test('renders card with content', () => {
      render(
        <MinimalCard>
          <p>Card content</p>
        </MinimalCard>
      )
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    test('renders with title', () => {
      render(<MinimalCard title="Card Title">Content</MinimalCard>)
      expect(screen.getByText('Card Title')).toBeInTheDocument()
    })

    test('renders with subtitle', () => {
      render(<MinimalCard subtitle="Card Subtitle">Content</MinimalCard>)
      expect(screen.getByText('Card Subtitle')).toBeInTheDocument()
    })

    test('renders with custom header', () => {
      const header = <div data-testid="custom-header">Custom Header</div>
      render(<MinimalCard header={header}>Content</MinimalCard>)
      expect(screen.getByTestId('custom-header')).toBeInTheDocument()
    })

    test('renders with footer', () => {
      const footer = <div data-testid="card-footer">Footer Content</div>
      render(<MinimalCard footer={footer}>Main Content</MinimalCard>)
      expect(screen.getByTestId('card-footer')).toBeInTheDocument()
    })

    test('renders with actions', () => {
      const actions = (
        <button data-testid="card-action">Action</button>
      )
      render(<MinimalCard actions={actions}>Content</MinimalCard>)
      expect(screen.getByTestId('card-action')).toBeInTheDocument()
    })

    test('renders with different variants', () => {
      const { rerender } = render(<MinimalCard variant="default">Default</MinimalCard>)
      let card = screen.getByText('Default').closest('.minimal-card')
      expect(card).toHaveClass('minimal-card-default')

      rerender(<MinimalCard variant="outlined">Outlined</MinimalCard>)
      card = screen.getByText('Outlined').closest('.minimal-card')
      expect(card).toHaveClass('minimal-card-outlined')

      rerender(<MinimalCard variant="elevated">Elevated</MinimalCard>)
      card = screen.getByText('Elevated').closest('.minimal-card')
      expect(card).toHaveClass('minimal-card-elevated')
    })

    test('renders with padding options', () => {
      const { rerender } = render(<MinimalCard padding="none">No padding</MinimalCard>)
      let card = screen.getByText('No padding').closest('.minimal-card')
      expect(card).toHaveClass('minimal-card-padding-none')

      rerender(<MinimalCard padding="small">Small padding</MinimalCard>)
      card = screen.getByText('Small padding').closest('.minimal-card')
      expect(card).toHaveClass('minimal-card-padding-small')

      rerender(<MinimalCard padding="large">Large padding</MinimalCard>)
      card = screen.getByText('Large padding').closest('.minimal-card')
      expect(card).toHaveClass('minimal-card-padding-large')
    })
  })

  describe('Interactive states', () => {
    test('renders as clickable when onClick is provided', () => {
      const handleClick = jest.fn()
      render(<MinimalCard onClick={handleClick}>Clickable card</MinimalCard>)
      
      const card = screen.getByText('Clickable card').closest('.minimal-card')
      expect(card).toHaveClass('minimal-card-clickable')
      
      fireEvent.click(card)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    test('renders with hover effect when hoverable', () => {
      render(<MinimalCard hoverable>Hoverable card</MinimalCard>)
      const card = screen.getByText('Hoverable card').closest('.minimal-card')
      expect(card).toHaveClass('minimal-card-hoverable')
    })

    test('renders with selected state', () => {
      render(<MinimalCard selected>Selected card</MinimalCard>)
      const card = screen.getByText('Selected card').closest('.minimal-card')
      expect(card).toHaveClass('minimal-card-selected')
    })

    test('renders with loading state', () => {
      render(<MinimalCard loading>Content</MinimalCard>)
      expect(screen.getByTestId('card-loading')).toBeInTheDocument()
    })

    test('renders with disabled state', () => {
      const handleClick = jest.fn()
      render(
        <MinimalCard disabled onClick={handleClick}>
          Disabled card
        </MinimalCard>
      )
      
      const card = screen.getByText('Disabled card').closest('.minimal-card')
      expect(card).toHaveClass('minimal-card-disabled')
      
      fireEvent.click(card)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Complex compositions', () => {
    test('renders complete card with all sections', () => {
      render(
        <MinimalCard
          title="Card Title"
          subtitle="Card Subtitle"
          actions={<button>Action</button>}
          footer={<div>Footer</div>}
        >
          <p>Main content</p>
        </MinimalCard>
      )

      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card Subtitle')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
      expect(screen.getByText('Main content')).toBeInTheDocument()
      expect(screen.getByText('Footer')).toBeInTheDocument()
    })

    test('renders with image', () => {
      render(
        <MinimalCard
          image={<img src="test.jpg" alt="Test" />}
          title="Card with Image"
        >
          Content
        </MinimalCard>
      )

      expect(screen.getByAltText('Test')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has correct ARIA attributes when clickable', () => {
      const handleClick = jest.fn()
      render(
        <MinimalCard onClick={handleClick} aria-label="Clickable card">
          Content
        </MinimalCard>
      )
      
      const card = screen.getByText('Content').closest('.minimal-card')
      expect(card).toHaveAttribute('role', 'button')
      expect(card).toHaveAttribute('tabIndex', '0')
      expect(card).toHaveAttribute('aria-label', 'Clickable card')
    })

    test('supports keyboard interaction when clickable', () => {
      const handleClick = jest.fn()
      render(<MinimalCard onClick={handleClick}>Clickable</MinimalCard>)
      
      const card = screen.getByText('Clickable').closest('.minimal-card')
      
      // Enter key
      fireEvent.keyDown(card, { key: 'Enter' })
      expect(handleClick).toHaveBeenCalledTimes(1)
      
      // Space key
      fireEvent.keyDown(card, { key: ' ' })
      expect(handleClick).toHaveBeenCalledTimes(2)
    })
  })

  describe('Custom props', () => {
    test('passes through additional props', () => {
      render(
        <MinimalCard 
          data-testid="custom-card" 
          className="custom-class"
          id="unique-card"
        >
          Content
        </MinimalCard>
      )
      const card = screen.getByText('Content').closest('.minimal-card')
      expect(card).toHaveAttribute('data-testid', 'custom-card')
      expect(card).toHaveClass('custom-class')
      expect(card).toHaveAttribute('id', 'unique-card')
    })

    test('merges className with default classes', () => {
      render(
        <MinimalCard className="custom-class" variant="outlined">
          Content
        </MinimalCard>
      )
      const card = screen.getByText('Content').closest('.minimal-card')
      expect(card).toHaveClass('minimal-card')
      expect(card).toHaveClass('minimal-card-outlined')
      expect(card).toHaveClass('custom-class')
    })
  })

  describe('Edge cases', () => {
    test('renders without any content', () => {
      const { container } = render(<MinimalCard />)
      expect(container.querySelector('.minimal-card')).toBeInTheDocument()
    })

    test('handles null/undefined props gracefully', () => {
      render(
        <MinimalCard
          title={null}
          subtitle={undefined}
          actions={null}
          footer={undefined}
        >
          Content
        </MinimalCard>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })
})