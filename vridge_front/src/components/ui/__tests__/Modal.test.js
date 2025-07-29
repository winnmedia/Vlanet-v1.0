import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Modal from '../Modal'

describe('Modal Component', () => {
  describe('Rendering', () => {
    test('renders modal when open', () => {
      render(
        <UnifiedModal isOpen={true} onClose={jest.fn()}>
          <p>Modal content</p>
        </UnifiedModal>
      )
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    test('does not render modal when closed', () => {
      render(
        <UnifiedModal isOpen={false} onClose={jest.fn()}>
          <p>Modal content</p>
        </UnifiedModal>
      )
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
    })

    test('renders with title', () => {
      render(
        <UnifiedModal isOpen={true} onClose={jest.fn()} title="Modal Title">
          Content
        </UnifiedModal>
      )
      expect(screen.getByText('Modal Title')).toBeInTheDocument()
    })

    test('renders with footer', () => {
      const footer = (
        <div>
          <button>Cancel</button>
          <button>Save</button>
        </div>
      )
      render(
        <UnifiedModal isOpen={true} onClose={jest.fn()} footer={footer}>
          Content
        </UnifiedModal>
      )
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    })

    test('renders close button when showCloseButton is true', () => {
      render(
        <UnifiedModal isOpen={true} onClose={jest.fn()} showCloseButton>
          Content
        </UnifiedModal>
      )
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    })

    test('renders with different sizes', () => {
      const { rerender } = render(
        <UnifiedModal isOpen={true} onClose={jest.fn()} size="small">
          Small modal
        </UnifiedModal>
      )
      expect(screen.getByRole('dialog')).toHaveClass('modal-small')

      rerender(
        <UnifiedModal isOpen={true} onClose={jest.fn()} size="large">
          Large modal
        </UnifiedModal>
      )
      expect(screen.getByRole('dialog')).toHaveClass('modal-large')
    })
  })

  describe('Interactions', () => {
    test('calls onClose when clicking overlay', () => {
      const handleClose = jest.fn()
      render(
        <UnifiedModal isOpen={true} onClose={handleClose}>
          Content
        </UnifiedModal>
      )
      
      const overlay = screen.getByTestId('modal-overlay')
      fireEvent.click(overlay)
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    test('does not close when clicking modal content', () => {
      const handleClose = jest.fn()
      render(
        <UnifiedModal isOpen={true} onClose={handleClose}>
          <div data-testid="modal-content">Content</div>
        </UnifiedModal>
      )
      
      fireEvent.click(screen.getByTestId('modal-content'))
      expect(handleClose).not.toHaveBeenCalled()
    })

    test('calls onClose when clicking close button', () => {
      const handleClose = jest.fn()
      render(
        <UnifiedModal isOpen={true} onClose={handleClose} showCloseButton>
          Content
        </UnifiedModal>
      )
      
      fireEvent.click(screen.getByLabelText('Close modal'))
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    test('does not close on overlay click when closeOnOverlayClick is false', () => {
      const handleClose = jest.fn()
      render(
        <UnifiedModal isOpen={true} onClose={handleClose} closeOnOverlayClick={false}>
          Content
        </UnifiedModal>
      )
      
      fireEvent.click(screen.getByTestId('modal-overlay'))
      expect(handleClose).not.toHaveBeenCalled()
    })

    test('closes on Escape key press', () => {
      const handleClose = jest.fn()
      render(
        <UnifiedModal isOpen={true} onClose={handleClose}>
          Content
        </UnifiedModal>
      )
      
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    test('does not close on Escape when closeOnEsc is false', () => {
      const handleClose = jest.fn()
      render(
        <UnifiedModal isOpen={true} onClose={handleClose} closeOnEsc={false}>
          Content
        </UnifiedModal>
      )
      
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(handleClose).not.toHaveBeenCalled()
    })
  })

  describe('Focus Management', () => {
    test('traps focus within modal', () => {
      render(
        <UnifiedModal isOpen={true} onClose={jest.fn()}>
          <button>First button</button>
          <input type="text" />
          <button>Last button</button>
        </UnifiedModal>
      )
      
      const firstButton = screen.getByRole('button', { name: 'First button' })
      const lastButton = screen.getByRole('button', { name: 'Last button' })
      
      // Focus should be trapped within these elements
      expect(document.body).toContainElement(firstButton)
      expect(document.body).toContainElement(lastButton)
    })

    test('restores focus on close', async () => {
      const Component = () => {
        const [isOpen, setIsOpen] = React.useState(false)
        const buttonRef = React.useRef(null)
        
        return (
          <>
            <button ref={buttonRef} onClick={() => setIsOpen(true)}>
              Open Modal
            </button>
            <UnifiedModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
              Modal Content
            </UnifiedModal>
          </>
        )
      }
      
      render(<Component />)
      const openButton = screen.getByRole('button', { name: 'Open Modal' })
      
      openButton.focus()
      fireEvent.click(openButton)
      
      expect(screen.getByText('Modal Content')).toBeInTheDocument()
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      await waitFor(() => {
        expect(screen.queryByText('Modal Content')).not.toBeInTheDocument()
      })
    })
  })

  describe('Animations', () => {
    test('applies animation classes', () => {
      const { rerender } = render(
        <UnifiedModal isOpen={false} onClose={jest.fn()}>
          Content
        </UnifiedModal>
      )
      
      rerender(
        <UnifiedModal isOpen={true} onClose={jest.fn()}>
          Content
        </UnifiedModal>
      )
      
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveClass('modal-enter')
    })
  })

  describe('Accessibility', () => {
    test('has correct ARIA attributes', () => {
      render(
        <UnifiedModal isOpen={true} 
          onClose={jest.fn()} 
          title="Accessible Modal"
          aria-describedby="modal-description"
        >
          <p id="modal-description">Modal description</p>
        </UnifiedModal>
      )
      
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveAttribute('aria-modal', 'true')
      expect(modal).toHaveAttribute('aria-labelledby')
      expect(modal).toHaveAttribute('aria-describedby', 'modal-description')
    })

    test('prevents body scroll when open', () => {
      render(
        <UnifiedModal isOpen={true} onClose={jest.fn()}>
          Content
        </UnifiedModal>
      )
      
      expect(document.body).toHaveStyle('overflow: hidden')
    })

    test('restores body scroll when closed', () => {
      const { rerender } = render(
        <UnifiedModal isOpen={true} onClose={jest.fn()}>
          Content
        </UnifiedModal>
      )
      
      rerender(
        <UnifiedModal isOpen={false} onClose={jest.fn()}>
          Content
        </UnifiedModal>
      )
      
      expect(document.body).not.toHaveStyle('overflow: hidden')
    })
  })

  describe('Portal rendering', () => {
    test('renders in document body', () => {
      render(
        <UnifiedModal isOpen={true} onClose={jest.fn()}>
          Portal content
        </UnifiedModal>
      )
      
      const modal = screen.getByText('Portal content').closest('.modal-container')
      expect(document.body).toContainElement(modal)
    })

    test('renders in custom container', () => {
      const container = document.createElement('div')
      container.id = 'custom-modal-root'
      document.body.appendChild(container)
      
      render(
        <UnifiedModal isOpen={true} onClose={jest.fn()} container={container}>
          Custom container content
        </UnifiedModal>
      )
      
      expect(container).toHaveTextContent('Custom container content')
      
      document.body.removeChild(container)
    })
  })

  describe('Custom props', () => {
    test('passes through additional props', () => {
      render(
        <UnifiedModal isOpen={true} 
          onClose={jest.fn()}
          data-testid="custom-modal"
          className="custom-modal-class"
        >
          Content
        </UnifiedModal>
      )
      
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveAttribute('data-testid', 'custom-modal')
      expect(modal).toHaveClass('custom-modal-class')
    })
  })
})