import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MinimalCard, CardHeader, CardContent, CardFooter, CardSkeleton } from '../MinimalCard'

describe('MinimalCard', () => {
  describe('MinimalCard Component', () => {
    it('renders children correctly', () => {
      render(
        <MinimalCard>
          <div>Test Content</div>
        </MinimalCard>
      )
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('applies hover class when hover prop is true', () => {
      const { container } = render(<MinimalCard hover>Content</MinimalCard>)
      const card = container.firstChild
      expect(card).toHaveClass('hover')
    })

    it('handles onClick event', () => {
      const handleClick = jest.fn()
      render(
        <MinimalCard onClick={handleClick}>
          Click me
        </MinimalCard>
      )
      
      const card = screen.getByRole('article')
      fireEvent.click(card)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('handles keyboard events for clickable cards', () => {
      const handleClick = jest.fn()
      render(
        <MinimalCard onClick={handleClick}>
          Press Enter
        </MinimalCard>
      )
      
      const card = screen.getByRole('article')
      
      // Enter key
      fireEvent.keyDown(card, { key: 'Enter' })
      expect(handleClick).toHaveBeenCalledTimes(1)
      
      // Space key
      fireEvent.keyDown(card, { key: ' ' })
      expect(handleClick).toHaveBeenCalledTimes(2)
      
      // Other keys should not trigger onClick
      fireEvent.keyDown(card, { key: 'a' })
      expect(handleClick).toHaveBeenCalledTimes(2)
    })

    it('applies custom className', () => {
      const { container } = render(
        <MinimalCard className="custom-class">Content</MinimalCard>
      )
      const card = container.firstChild
      expect(card).toHaveClass('custom-class')
    })

    it('renders with custom element type', () => {
      const { container } = render(
        <MinimalCard as="section">Content</MinimalCard>
      )
      const card = container.querySelector('section')
      expect(card).toBeInTheDocument()
    })

    it('applies correct padding class', () => {
      const { container, rerender } = render(
        <MinimalCard padding="small">Content</MinimalCard>
      )
      expect(container.firstChild).toHaveClass('padding-small')
      
      rerender(<MinimalCard padding="large">Content</MinimalCard>)
      expect(container.firstChild).toHaveClass('padding-large')
    })

    it('sets correct ARIA attributes', () => {
      render(
        <MinimalCard ariaLabel="Custom card" tabIndex={-1}>
          Content
        </MinimalCard>
      )
      
      const card = screen.getByRole('article')
      expect(card).toHaveAttribute('aria-label', 'Custom card')
      expect(card).toHaveAttribute('tabindex', '-1')
    })
  })

  describe('CardHeader Component', () => {
    it('renders title and subtitle', () => {
      render(
        <CardHeader 
          title="Test Title" 
          subtitle="Test Subtitle" 
        />
      )
      
      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
    })

    it('renders icon when provided', () => {
      render(
        <CardHeader 
          title="Title" 
          icon={<span data-testid="test-icon">Icon</span>} 
        />
      )
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('renders action element', () => {
      render(
        <CardHeader 
          title="Title" 
          action={<button>Action</button>} 
        />
      )
      
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    })

    it('renders children when no title/subtitle provided', () => {
      render(
        <CardHeader>
          <div>Custom Header Content</div>
        </CardHeader>
      )
      
      expect(screen.getByText('Custom Header Content')).toBeInTheDocument()
    })
  })

  describe('CardContent Component', () => {
    it('renders children', () => {
      render(
        <CardContent>
          <p>Content text</p>
        </CardContent>
      )
      
      expect(screen.getByText('Content text')).toBeInTheDocument()
    })

    it('applies padding classes', () => {
      const { container } = render(
        <CardContent padding="none">Content</CardContent>
      )
      
      expect(container.firstChild).toHaveClass('contentPadding-none')
    })
  })

  describe('CardFooter Component', () => {
    it('renders children', () => {
      render(
        <CardFooter>
          <button>Footer Button</button>
        </CardFooter>
      )
      
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('applies alignment classes', () => {
      const { container } = render(
        <CardFooter align="start">Content</CardFooter>
      )
      
      expect(container.firstChild).toHaveClass('align-start')
    })

    it('applies divider class when divider is true', () => {
      const { container } = render(
        <CardFooter divider>Content</CardFooter>
      )
      
      expect(container.firstChild).toHaveClass('withDivider')
    })
  })

  describe('CardSkeleton Component', () => {
    it('renders with default 3 lines', () => {
      const { container } = render(<CardSkeleton />)
      const lines = container.querySelectorAll('.skeletonLine')
      expect(lines).toHaveLength(3)
    })

    it('renders with custom number of lines', () => {
      const { container } = render(<CardSkeleton lines={5} />)
      const lines = container.querySelectorAll('.skeletonLine')
      expect(lines).toHaveLength(5)
    })

    it('applies skeleton classes', () => {
      const { container } = render(<CardSkeleton />)
      const card = container.firstChild
      expect(card).toHaveClass('card')
      expect(card).toHaveClass('skeleton')
    })

    it('renders header skeleton elements', () => {
      const { container } = render(<CardSkeleton />)
      expect(container.querySelector('.skeletonTitle')).toBeInTheDocument()
      expect(container.querySelector('.skeletonSubtitle')).toBeInTheDocument()
    })
  })

  describe('Integration Tests', () => {
    it('renders complete card with all sections', () => {
      const handleClick = jest.fn()
      
      render(
        <MinimalCard onClick={handleClick} hover>
          <CardHeader 
            title="Project Name"
            subtitle="Client Name"
            action={<button>Edit</button>}
          />
          <CardContent>
            <p>Project description goes here</p>
          </CardContent>
          <CardFooter divider align="end">
            <button>View Details</button>
          </CardFooter>
        </MinimalCard>
      )
      
      expect(screen.getByText('Project Name')).toBeInTheDocument()
      expect(screen.getByText('Client Name')).toBeInTheDocument()
      expect(screen.getByText('Project description goes here')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'View Details' })).toBeInTheDocument()
      
      // Test interaction
      fireEvent.click(screen.getByRole('article'))
      expect(handleClick).toHaveBeenCalled()
    })
  })
})