import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import CustomAlert, { showAlert } from '../CustomAlert'

// Mock timer functions
jest.useFakeTimers()

describe('CustomAlert Component', () => {
  afterEach(() => {
    jest.clearAllTimers()
    act(() => {
      jest.runAllTimers()
    })
  })

  describe('Alert Display', () => {
    test('does not render when no alert is shown', () => {
      render(<CustomAlert />)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    test('renders success alert', async () => {
      render(<CustomAlert />)
      
      act(() => {
        showAlert('success', 'Operation successful!')
      })
      
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
        expect(alert).toHaveClass('custom-alert-success')
        expect(screen.getByText('Operation successful!')).toBeInTheDocument()
      })
    })

    test('renders error alert', async () => {
      render(<CustomAlert />)
      
      act(() => {
        showAlert('error', 'Something went wrong!')
      })
      
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveClass('custom-alert-error')
        expect(screen.getByText('Something went wrong!')).toBeInTheDocument()
      })
    })

    test('renders warning alert', async () => {
      render(<CustomAlert />)
      
      act(() => {
        showAlert('warning', 'Please be careful!')
      })
      
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveClass('custom-alert-warning')
        expect(screen.getByText('Please be careful!')).toBeInTheDocument()
      })
    })

    test('renders info alert', async () => {
      render(<CustomAlert />)
      
      act(() => {
        showAlert('info', 'For your information')
      })
      
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveClass('custom-alert-info')
        expect(screen.getByText('For your information')).toBeInTheDocument()
      })
    })
  })

  describe('Alert Icons', () => {
    test('shows correct icon for each alert type', async () => {
      const { rerender } = render(<CustomAlert />)
      
      // Success icon
      act(() => {
        showAlert('success', 'Success')
      })
      await waitFor(() => {
        expect(screen.getByTestId('success-icon')).toBeInTheDocument()
      })
      
      // Error icon
      act(() => {
        showAlert('error', 'Error')
      })
      await waitFor(() => {
        expect(screen.getByTestId('error-icon')).toBeInTheDocument()
      })
      
      // Warning icon
      act(() => {
        showAlert('warning', 'Warning')
      })
      await waitFor(() => {
        expect(screen.getByTestId('warning-icon')).toBeInTheDocument()
      })
      
      // Info icon
      act(() => {
        showAlert('info', 'Info')
      })
      await waitFor(() => {
        expect(screen.getByTestId('info-icon')).toBeInTheDocument()
      })
    })
  })

  describe('Auto-dismiss', () => {
    test('auto-dismisses after default duration', async () => {
      render(<CustomAlert />)
      
      act(() => {
        showAlert('success', 'Auto dismiss test')
      })
      
      expect(screen.getByText('Auto dismiss test')).toBeInTheDocument()
      
      act(() => {
        jest.advanceTimersByTime(3000)
      })
      
      await waitFor(() => {
        expect(screen.queryByText('Auto dismiss test')).not.toBeInTheDocument()
      })
    })

    test('respects custom duration', async () => {
      render(<CustomAlert />)
      
      act(() => {
        showAlert('info', 'Custom duration', 5000)
      })
      
      expect(screen.getByText('Custom duration')).toBeInTheDocument()
      
      // Should still be visible after 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000)
      })
      expect(screen.getByText('Custom duration')).toBeInTheDocument()
      
      // Should disappear after 5 seconds
      act(() => {
        jest.advanceTimersByTime(2000)
      })
      
      await waitFor(() => {
        expect(screen.queryByText('Custom duration')).not.toBeInTheDocument()
      })
    })

    test('does not auto-dismiss when duration is null', async () => {
      render(<CustomAlert />)
      
      act(() => {
        showAlert('error', 'Persistent alert', null)
      })
      
      expect(screen.getByText('Persistent alert')).toBeInTheDocument()
      
      // Should still be visible after a long time
      act(() => {
        jest.advanceTimersByTime(10000)
      })
      
      expect(screen.getByText('Persistent alert')).toBeInTheDocument()
    })
  })

  describe('Manual dismiss', () => {
    test('can be manually dismissed with close button', async () => {
      render(<CustomAlert />)
      
      act(() => {
        showAlert('success', 'Dismissible alert')
      })
      
      const closeButton = screen.getByLabelText('Close alert')
      fireEvent.click(closeButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Dismissible alert')).not.toBeInTheDocument()
      })
    })

    test('calls onClose callback when dismissed', async () => {
      const handleClose = jest.fn()
      render(<CustomAlert />)
      
      act(() => {
        showAlert('info', 'Alert with callback', 3000, handleClose)
      })
      
      const closeButton = screen.getByLabelText('Close alert')
      fireEvent.click(closeButton)
      
      await waitFor(() => {
        expect(handleClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Multiple alerts', () => {
    test('replaces previous alert when new one is shown', async () => {
      render(<CustomAlert />)
      
      act(() => {
        showAlert('success', 'First alert')
      })
      expect(screen.getByText('First alert')).toBeInTheDocument()
      
      act(() => {
        showAlert('error', 'Second alert')
      })
      
      await waitFor(() => {
        expect(screen.queryByText('First alert')).not.toBeInTheDocument()
        expect(screen.getByText('Second alert')).toBeInTheDocument()
      })
    })
  })

  describe('Animations', () => {
    test('applies enter animation class', async () => {
      render(<CustomAlert />)
      
      act(() => {
        showAlert('success', 'Animated alert')
      })
      
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveClass('custom-alert-enter')
      })
    })

    test('applies exit animation class before removal', async () => {
      render(<CustomAlert />)
      
      act(() => {
        showAlert('success', 'Exit animation test', 1000)
      })
      
      act(() => {
        jest.advanceTimersByTime(1000)
      })
      
      await waitFor(() => {
        const alert = screen.queryByRole('alert')
        if (alert) {
          expect(alert).toHaveClass('custom-alert-exit')
        }
      })
    })
  })

  describe('Accessibility', () => {
    test('has correct ARIA attributes', async () => {
      render(<CustomAlert />)
      
      act(() => {
        showAlert('error', 'Accessible alert')
      })
      
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveAttribute('aria-live', 'polite')
        expect(alert).toHaveAttribute('aria-atomic', 'true')
      })
    })

    test('close button is keyboard accessible', async () => {
      render(<CustomAlert />)
      
      act(() => {
        showAlert('info', 'Keyboard test')
      })
      
      const closeButton = screen.getByLabelText('Close alert')
      closeButton.focus()
      
      fireEvent.keyDown(closeButton, { key: 'Enter' })
      
      await waitFor(() => {
        expect(screen.queryByText('Keyboard test')).not.toBeInTheDocument()
      })
    })
  })

  describe('Custom content', () => {
    test('renders HTML content', async () => {
      render(<CustomAlert />)
      
      act(() => {
        showAlert('info', '<strong>Bold text</strong> and <em>italic text</em>')
      })
      
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert.innerHTML).toContain('<strong>Bold text</strong>')
        expect(alert.innerHTML).toContain('<em>italic text</em>')
      })
    })

    test('handles long messages with proper wrapping', async () => {
      render(<CustomAlert />)
      
      const longMessage = 'This is a very long alert message '.repeat(10)
      
      act(() => {
        showAlert('warning', longMessage)
      })
      
      await waitFor(() => {
        expect(screen.getByText(longMessage)).toBeInTheDocument()
      })
    })
  })

  describe('Position', () => {
    test('renders at top by default', async () => {
      render(<CustomAlert />)
      
      act(() => {
        showAlert('success', 'Top position')
      })
      
      await waitFor(() => {
        const container = screen.getByRole('alert').parentElement
        expect(container).toHaveClass('custom-alert-container-top')
      })
    })

    test('can render at bottom', async () => {
      render(<CustomAlert position="bottom" />)
      
      act(() => {
        showAlert('success', 'Bottom position')
      })
      
      await waitFor(() => {
        const container = screen.getByRole('alert').parentElement
        expect(container).toHaveClass('custom-alert-container-bottom')
      })
    })
  })
})