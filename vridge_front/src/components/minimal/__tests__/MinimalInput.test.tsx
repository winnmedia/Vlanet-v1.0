import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MinimalInput, MinimalTextarea } from '../MinimalInput'

describe('MinimalInput', () => {
  describe('MinimalInput Component', () => {
    it('renders input with label', () => {
      render(<MinimalInput label="Username" name="username" />)
      
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('shows required indicator', () => {
      render(<MinimalInput label="Email" required />)
      
      expect(screen.getByText('*')).toBeInTheDocument()
      expect(screen.getByText('*')).toHaveAttribute('aria-label', '필수')
    })

    it('handles controlled input', () => {
      const handleChange = jest.fn()
      const { rerender } = render(
        <MinimalInput value="initial" onChange={handleChange} />
      )
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('initial')
      
      fireEvent.change(input, { target: { value: 'updated' } })
      expect(handleChange).toHaveBeenCalled()
      
      rerender(<MinimalInput value="updated" onChange={handleChange} />)
      expect(input).toHaveValue('updated')
    })

    it('handles uncontrolled input with defaultValue', () => {
      render(<MinimalInput defaultValue="default text" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('default text')
      
      fireEvent.change(input, { target: { value: 'new text' } })
      expect(input).toHaveValue('new text')
    })

    it('displays error message', () => {
      render(
        <MinimalInput 
          label="Email" 
          error="Email is required" 
          id="email-input"
        />
      )
      
      const errorMessage = screen.getByRole('alert')
      expect(errorMessage).toHaveTextContent('Email is required')
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', 'email-input-error')
    })

    it('displays helper text', () => {
      render(
        <MinimalInput 
          label="Password" 
          helperText="Must be at least 8 characters" 
          id="password-input"
        />
      )
      
      const helperText = screen.getByText('Must be at least 8 characters')
      expect(helperText).toBeInTheDocument()
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'password-input-helper')
    })

    it('shows character count when enabled', async () => {
      const user = userEvent.setup()
      render(
        <MinimalInput 
          label="Bio" 
          maxLength={100} 
          showCharacterCount 
        />
      )
      
      expect(screen.getByText('0/100')).toBeInTheDocument()
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'Hello world')
      
      expect(screen.getByText('11/100')).toBeInTheDocument()
    })

    it('renders icon on the left by default', () => {
      render(
        <MinimalInput 
          icon={<span data-testid="search-icon">🔍</span>}
          placeholder="Search..."
        />
      )
      
      const icon = screen.getByTestId('search-icon')
      expect(icon.parentElement).toHaveClass('icon-left')
    })

    it('renders icon on the right when specified', () => {
      render(
        <MinimalInput 
          icon={<span data-testid="info-icon">ℹ️</span>}
          iconPosition="right"
          placeholder="Enter text"
        />
      )
      
      const icon = screen.getByTestId('info-icon')
      expect(icon.parentElement).toHaveClass('icon-right')
    })

    it('handles different input types', () => {
      const { rerender } = render(<MinimalInput type="email" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
      
      rerender(<MinimalInput type="password" />)
      // Password inputs don't have textbox role
      expect(screen.getByLabelText('')).toHaveAttribute('type', 'password')
      
      rerender(<MinimalInput type="number" />)
      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number')
    })

    it('applies size classes', () => {
      const { container, rerender } = render(
        <MinimalInput size="small" />
      )
      expect(container.firstChild).toHaveClass('size-small')
      
      rerender(<MinimalInput size="large" />)
      expect(container.firstChild).toHaveClass('size-large')
    })

    it('handles disabled state', () => {
      render(<MinimalInput disabled label="Disabled Input" />)
      
      const input = screen.getByLabelText('Disabled Input')
      expect(input).toBeDisabled()
      expect(input.parentElement.parentElement).toHaveClass('disabled')
    })

    it('handles readOnly state', () => {
      render(<MinimalInput readOnly value="Read only text" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('readonly')
    })

    it('handles focus and blur events', () => {
      const handleFocus = jest.fn()
      const handleBlur = jest.fn()
      
      render(
        <MinimalInput 
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      )
      
      const input = screen.getByRole('textbox')
      
      fireEvent.focus(input)
      expect(handleFocus).toHaveBeenCalled()
      
      fireEvent.blur(input)
      expect(handleBlur).toHaveBeenCalled()
    })

    it('applies autoFocus', () => {
      render(<MinimalInput autoFocus />)
      
      const input = screen.getByRole('textbox')
      expect(document.activeElement).toBe(input)
    })

    it('handles number input constraints', () => {
      render(
        <MinimalInput 
          type="number"
          min={0}
          max={100}
          step={5}
        />
      )
      
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '100')
      expect(input).toHaveAttribute('step', '5')
    })
  })

  describe('MinimalTextarea Component', () => {
    it('renders textarea with label', () => {
      render(<MinimalTextarea label="Description" name="description" />)
      
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('handles controlled textarea', () => {
      const handleChange = jest.fn()
      const { rerender } = render(
        <MinimalTextarea value="initial" onChange={handleChange} />
      )
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('initial')
      
      fireEvent.change(textarea, { target: { value: 'updated' } })
      expect(handleChange).toHaveBeenCalled()
      
      rerender(<MinimalTextarea value="updated" onChange={handleChange} />)
      expect(textarea).toHaveValue('updated')
    })

    it('shows character count for textarea', async () => {
      const user = userEvent.setup()
      render(
        <MinimalTextarea 
          label="Comment" 
          maxLength={500} 
          showCharacterCount 
        />
      )
      
      expect(screen.getByText('0/500')).toBeInTheDocument()
      
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'This is a longer comment')
      
      expect(screen.getByText('24/500')).toBeInTheDocument()
    })

    it('applies rows and cols attributes', () => {
      render(
        <MinimalTextarea 
          rows={10}
          cols={50}
        />
      )
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('rows', '10')
      expect(textarea).toHaveAttribute('cols', '50')
    })

    it('applies resize classes', () => {
      const { container, rerender } = render(
        <MinimalTextarea resize="none" />
      )
      
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveClass('resize-none')
      
      rerender(<MinimalTextarea resize="vertical" />)
      expect(textarea).toHaveClass('resize-vertical')
      
      rerender(<MinimalTextarea resize="horizontal" />)
      expect(textarea).toHaveClass('resize-horizontal')
      
      rerender(<MinimalTextarea resize="both" />)
      expect(textarea).toHaveClass('resize-both')
    })

    it('displays error and helper text', () => {
      render(
        <MinimalTextarea 
          label="Message"
          error="Message is too short"
          helperText="Minimum 10 characters"
          id="message"
        />
      )
      
      const errorMessage = screen.getByRole('alert')
      expect(errorMessage).toHaveTextContent('Message is too short')
      
      // Helper text should not be shown when there's an error
      expect(screen.queryByText('Minimum 10 characters')).not.toBeInTheDocument()
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-invalid', 'true')
      expect(textarea).toHaveAttribute('aria-describedby', 'message-error')
    })

    it('handles all inherited props from MinimalInput', () => {
      const handleFocus = jest.fn()
      const handleBlur = jest.fn()
      const handleKeyDown = jest.fn()
      
      render(
        <MinimalTextarea
          label="Notes"
          required
          disabled={false}
          readOnly={false}
          autoFocus
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      )
      
      const textarea = screen.getByLabelText('Notes*')
      expect(document.activeElement).toBe(textarea)
      
      fireEvent.focus(textarea)
      expect(handleFocus).toHaveBeenCalled()
      
      fireEvent.keyDown(textarea, { key: 'Enter' })
      expect(handleKeyDown).toHaveBeenCalled()
    })
  })

  describe('Integration Tests', () => {
    it('works in a form with validation', async () => {
      const user = userEvent.setup()
      const handleSubmit = jest.fn((e) => e.preventDefault())
      
      const { rerender } = render(
        <form onSubmit={handleSubmit}>
          <MinimalInput
            label="Email"
            type="email"
            name="email"
            required
            placeholder="Enter your email"
          />
          <MinimalTextarea
            label="Message"
            name="message"
            required
            minLength={10}
            maxLength={500}
            showCharacterCount
            placeholder="Enter your message"
          />
          <button type="submit">Submit</button>
        </form>
      )
      
      const emailInput = screen.getByLabelText('Email*')
      const messageTextarea = screen.getByLabelText('Message*')
      const submitButton = screen.getByRole('button', { name: 'Submit' })
      
      // Try submitting empty form
      fireEvent.click(submitButton)
      
      // Fill in the form
      await user.type(emailInput, 'test@example.com')
      await user.type(messageTextarea, 'This is my test message')
      
      expect(screen.getByText('23/500')).toBeInTheDocument()
      
      // Submit the form
      fireEvent.click(submitButton)
      expect(handleSubmit).toHaveBeenCalled()
    })

    it('maintains focus states correctly', () => {
      const { container } = render(
        <>
          <MinimalInput label="First Name" />
          <MinimalInput label="Last Name" />
          <MinimalTextarea label="Bio" />
        </>
      )
      
      const firstName = screen.getByLabelText('First Name')
      const lastName = screen.getByLabelText('Last Name')
      const bio = screen.getByLabelText('Bio')
      
      // Focus first input
      fireEvent.focus(firstName)
      expect(firstName.parentElement.parentElement).toHaveClass('focused')
      
      // Move to second input
      fireEvent.blur(firstName)
      fireEvent.focus(lastName)
      expect(firstName.parentElement.parentElement).not.toHaveClass('focused')
      expect(lastName.parentElement.parentElement).toHaveClass('focused')
      
      // Move to textarea
      fireEvent.blur(lastName)
      fireEvent.focus(bio)
      expect(lastName.parentElement.parentElement).not.toHaveClass('focused')
      expect(bio.parentElement).toHaveClass('focused')
    })
  })
})