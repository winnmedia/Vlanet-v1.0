import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MinimalButton, IconButton, ButtonGroup } from '../MinimalButton'

describe('MinimalButton', () => {
  describe('MinimalButton Component', () => {
    it('renders children correctly', () => {
      render(<MinimalButton>Click me</MinimalButton>)
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('handles click events', () => {
      const handleClick = jest.fn()
      render(<MinimalButton onClick={handleClick}>Click me</MinimalButton>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('prevents click when disabled', () => {
      const handleClick = jest.fn()
      render(
        <MinimalButton onClick={handleClick} disabled>
          Click me
        </MinimalButton>
      )
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('prevents click when loading', () => {
      const handleClick = jest.fn()
      render(
        <MinimalButton onClick={handleClick} loading>
          Click me
        </MinimalButton>
      )
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
      expect(screen.getByRole('button')).toBeDisabled()
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
    })

    it('renders loading spinner when loading', () => {
      const { container } = render(<MinimalButton loading>Loading</MinimalButton>)
      expect(container.querySelector('.loadingSpinner')).toBeInTheDocument()
    })

    it('applies variant classes', () => {
      const { container, rerender } = render(
        <MinimalButton variant="primary">Button</MinimalButton>
      )
      expect(container.firstChild).toHaveClass('variant-primary')
      
      rerender(<MinimalButton variant="secondary">Button</MinimalButton>)
      expect(container.firstChild).toHaveClass('variant-secondary')
      
      rerender(<MinimalButton variant="danger">Button</MinimalButton>)
      expect(container.firstChild).toHaveClass('variant-danger')
    })

    it('applies size classes', () => {
      const { container, rerender } = render(
        <MinimalButton size="small">Button</MinimalButton>
      )
      expect(container.firstChild).toHaveClass('size-small')
      
      rerender(<MinimalButton size="large">Button</MinimalButton>)
      expect(container.firstChild).toHaveClass('size-large')
    })

    it('applies fullWidth class', () => {
      const { container } = render(
        <MinimalButton fullWidth>Button</MinimalButton>
      )
      expect(container.firstChild).toHaveClass('fullWidth')
    })

    it('renders icon on the left by default', () => {
      const { container } = render(
        <MinimalButton icon={<span data-testid="icon">📁</span>}>
          Save
        </MinimalButton>
      )
      
      const icon = screen.getByTestId('icon')
      const text = screen.getByText('Save')
      
      // Icon should come before text in DOM
      expect(container.querySelector('.icon')).toContainElement(icon)
      expect(icon.compareDocumentPosition(text)).toBe(4) // DOCUMENT_POSITION_FOLLOWING
    })

    it('renders icon on the right when specified', () => {
      const { container } = render(
        <MinimalButton icon={<span data-testid="icon">➡️</span>} iconPosition="right">
          Next
        </MinimalButton>
      )
      
      const icon = screen.getByTestId('icon')
      const text = screen.getByText('Next')
      
      // Icon should come after text in DOM
      expect(icon.compareDocumentPosition(text)).toBe(2) // DOCUMENT_POSITION_PRECEDING
    })

    it('renders as anchor tag when href is provided', () => {
      render(
        <MinimalButton href="https://example.com" target="_blank">
          External Link
        </MinimalButton>
      )
      
      const link = screen.getByText('External Link')
      expect(link.tagName).toBe('A')
      expect(link).toHaveAttribute('href', 'https://example.com')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('does not render as link when href is provided but disabled', () => {
      render(
        <MinimalButton href="https://example.com" disabled>
          Disabled Link
        </MinimalButton>
      )
      
      const button = screen.getByRole('button')
      expect(button.tagName).toBe('BUTTON')
    })

    it('applies tooltip attributes', () => {
      render(
        <MinimalButton tooltip="Save document" tooltipPosition="bottom">
          Save
        </MinimalButton>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', 'Save document')
      expect(button).toHaveAttribute('data-tooltip-position', 'bottom')
    })

    it('applies active class when active', () => {
      const { container } = render(
        <MinimalButton active>Active Button</MinimalButton>
      )
      expect(container.firstChild).toHaveClass('active')
    })

    it('sets correct button type', () => {
      render(<MinimalButton type="submit">Submit</MinimalButton>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })
  })

  describe('IconButton Component', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

    afterEach(() => {
      consoleWarnSpy.mockClear()
    })

    afterAll(() => {
      consoleWarnSpy.mockRestore()
    })

    it('renders icon correctly', () => {
      render(
        <IconButton icon={<span data-testid="icon">🔍</span>} ariaLabel="Search" />
      )
      
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Search')
    })

    it('warns when ariaLabel is not provided', () => {
      render(<IconButton icon={<span>🔍</span>} />)
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'IconButton requires an ariaLabel for accessibility'
      )
    })

    it('applies iconButton class', () => {
      const { container } = render(
        <IconButton icon={<span>🔍</span>} ariaLabel="Search" />
      )
      
      expect(container.firstChild).toHaveClass('iconButton')
    })

    it('passes through all MinimalButton props', () => {
      const handleClick = jest.fn()
      render(
        <IconButton
          icon={<span>🔍</span>}
          ariaLabel="Search"
          onClick={handleClick}
          variant="secondary"
          size="small"
          disabled
        />
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('variant-secondary', 'size-small')
      expect(button).toBeDisabled()
      
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('ButtonGroup Component', () => {
    it('renders children correctly', () => {
      render(
        <ButtonGroup>
          <MinimalButton>Button 1</MinimalButton>
          <MinimalButton>Button 2</MinimalButton>
        </ButtonGroup>
      )
      
      expect(screen.getByRole('button', { name: 'Button 1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Button 2' })).toBeInTheDocument()
    })

    it('applies spacing classes', () => {
      const { container, rerender } = render(
        <ButtonGroup spacing="small">
          <MinimalButton>Button</MinimalButton>
        </ButtonGroup>
      )
      
      expect(container.firstChild).toHaveClass('spacing-small')
      
      rerender(
        <ButtonGroup spacing="medium">
          <MinimalButton>Button</MinimalButton>
        </ButtonGroup>
      )
      expect(container.firstChild).toHaveClass('spacing-medium')
    })

    it('applies direction classes', () => {
      const { container, rerender } = render(
        <ButtonGroup direction="horizontal">
          <MinimalButton>Button</MinimalButton>
        </ButtonGroup>
      )
      
      expect(container.firstChild).toHaveClass('direction-horizontal')
      
      rerender(
        <ButtonGroup direction="vertical">
          <MinimalButton>Button</MinimalButton>
        </ButtonGroup>
      )
      expect(container.firstChild).toHaveClass('direction-vertical')
    })

    it('applies fullWidth class', () => {
      const { container } = render(
        <ButtonGroup fullWidth>
          <MinimalButton>Button</MinimalButton>
        </ButtonGroup>
      )
      
      expect(container.firstChild).toHaveClass('fullWidth')
    })

    it('has correct role attribute', () => {
      render(
        <ButtonGroup>
          <MinimalButton>Button</MinimalButton>
        </ButtonGroup>
      )
      
      expect(screen.getByRole('group')).toBeInTheDocument()
    })
  })

  describe('Integration Tests', () => {
    it('renders button group with mixed button types', () => {
      const handleSave = jest.fn()
      const handleCancel = jest.fn()
      
      render(
        <ButtonGroup>
          <MinimalButton 
            variant="primary" 
            onClick={handleSave}
            icon={<span>💾</span>}
          >
            Save
          </MinimalButton>
          <MinimalButton 
            variant="secondary" 
            onClick={handleCancel}
          >
            Cancel
          </MinimalButton>
          <IconButton
            icon={<span>⚙️</span>}
            ariaLabel="Settings"
            variant="ghost"
          />
        </ButtonGroup>
      )
      
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
      
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
      expect(handleSave).toHaveBeenCalled()
      
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(handleCancel).toHaveBeenCalled()
    })
  })
})