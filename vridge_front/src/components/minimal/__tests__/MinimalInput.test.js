import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MinimalInput } from '../MinimalInput'

describe('MinimalInput Component', () => {
  describe('Rendering', () => {
    test('renders input with label', () => {
      render(<MinimalInput label="Email" name="email" />)
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
    })

    test('renders input without label', () => {
      render(<MinimalInput placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    test('renders with error state', () => {
      render(<MinimalInput error="This field is required" />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toHaveClass('minimal-input-error')
    })

    test('renders with helper text', () => {
      render(<MinimalInput helperText="Enter a valid email" />)
      expect(screen.getByText('Enter a valid email')).toBeInTheDocument()
    })

    test('renders required indicator', () => {
      render(<MinimalInput label="Email" required />)
      expect(screen.getByText('*')).toBeInTheDocument()
    })

    test('renders with icon', () => {
      const Icon = () => <span data-testid="email-icon">📧</span>
      render(<MinimalInput icon={<Icon />} />)
      expect(screen.getByTestId('email-icon')).toBeInTheDocument()
    })

    test('renders different input types', () => {
      const { rerender } = render(<MinimalInput type="text" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text')

      rerender(<MinimalInput type="email" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')

      rerender(<MinimalInput type="password" />)
      const passwordInput = screen.getByLabelText('Password', { selector: 'input' })
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Interactions', () => {
    test('handles value changes', () => {
      const handleChange = jest.fn()
      render(<MinimalInput onChange={handleChange} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'test value' } })
      
      expect(handleChange).toHaveBeenCalledTimes(1)
      expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
        target: expect.objectContaining({ value: 'test value' })
      }))
    })

    test('handles focus and blur events', () => {
      const handleFocus = jest.fn()
      const handleBlur = jest.fn()
      render(<MinimalInput onFocus={handleFocus} onBlur={handleBlur} />)
      
      const input = screen.getByRole('textbox')
      
      fireEvent.focus(input)
      expect(handleFocus).toHaveBeenCalledTimes(1)
      
      fireEvent.blur(input)
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    test('respects disabled state', () => {
      const handleChange = jest.fn()
      render(<MinimalInput disabled onChange={handleChange} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
      
      fireEvent.change(input, { target: { value: 'test' } })
      expect(handleChange).not.toHaveBeenCalled()
    })

    test('respects readOnly state', () => {
      render(<MinimalInput readOnly value="readonly value" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('readOnly')
      expect(input).toHaveValue('readonly value')
    })
  })

  describe('Validation states', () => {
    test('shows error styling', () => {
      render(<MinimalInput error="Invalid input" />)
      const wrapper = screen.getByRole('textbox').closest('.minimal-input-wrapper')
      expect(wrapper).toHaveClass('minimal-input-error')
    })

    test('shows success styling', () => {
      render(<MinimalInput success />)
      const wrapper = screen.getByRole('textbox').closest('.minimal-input-wrapper')
      expect(wrapper).toHaveClass('minimal-input-success')
    })
  })

  describe('Controlled vs Uncontrolled', () => {
    test('works as controlled component', () => {
      const Component = () => {
        const [value, setValue] = React.useState('initial')
        return (
          <MinimalInput 
            value={value} 
            onChange={(e) => setValue(e.target.value)}
          />
        )
      }
      
      render(<Component />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveValue('initial')
      
      fireEvent.change(input, { target: { value: 'updated' } })
      expect(input).toHaveValue('updated')
    })

    test('works as uncontrolled component', () => {
      render(<MinimalInput defaultValue="default" />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveValue('default')
      
      fireEvent.change(input, { target: { value: 'changed' } })
      expect(input).toHaveValue('changed')
    })
  })

  describe('Accessibility', () => {
    test('associates label with input', () => {
      render(<MinimalInput label="Username" id="username" />)
      const input = screen.getByLabelText('Username')
      expect(input).toHaveAttribute('id', 'username')
    })

    test('has correct ARIA attributes when invalid', () => {
      render(<MinimalInput error="Invalid input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    test('has correct ARIA attributes when required', () => {
      render(<MinimalInput required />)
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true')
    })

    test('supports custom aria-label', () => {
      render(<MinimalInput aria-label="Custom input label" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Custom input label')
    })
  })

  describe('Size variants', () => {
    test('renders small size', () => {
      render(<MinimalInput size="small" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('minimal-input-sm')
    })

    test('renders medium size by default', () => {
      render(<MinimalInput />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('minimal-input-md')
    })

    test('renders large size', () => {
      render(<MinimalInput size="large" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('minimal-input-lg')
    })
  })
})