import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Input from '../Input'

describe('Input Component', () => {
  describe('Rendering', () => {
    test('renders input with label', () => {
      render(<Input label="Email" name="email" />)
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
    })

    test('renders input without label', () => {
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    test('renders with different types', () => {
      const { rerender } = render(<Input type="text" placeholder="Text" />)
      expect(screen.getByPlaceholderText('Text')).toHaveAttribute('type', 'text')

      rerender(<Input type="email" placeholder="Email" />)
      expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email')

      rerender(<Input type="password" placeholder="Password" />)
      expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')
    })

    test('renders with error state', () => {
      render(<Input error="This field is required" />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toHaveClass('input-error')
    })

    test('renders with helper text', () => {
      render(<Input helperText="Enter a valid email address" />)
      expect(screen.getByText('Enter a valid email address')).toBeInTheDocument()
    })

    test('renders required indicator', () => {
      render(<Input label="Email" required />)
      const label = screen.getByText('Email')
      expect(label.parentElement).toHaveTextContent('*')
    })

    test('renders with prefix and suffix', () => {
      render(
        <Input 
          prefix={<span data-testid="prefix">$</span>}
          suffix={<span data-testid="suffix">.00</span>}
        />
      )
      expect(screen.getByTestId('prefix')).toBeInTheDocument()
      expect(screen.getByTestId('suffix')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    test('handles value changes', () => {
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)
      
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
      render(<Input onFocus={handleFocus} onBlur={handleBlur} />)
      
      const input = screen.getByRole('textbox')
      
      fireEvent.focus(input)
      expect(handleFocus).toHaveBeenCalledTimes(1)
      
      fireEvent.blur(input)
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    test('respects disabled state', () => {
      const handleChange = jest.fn()
      render(<Input disabled onChange={handleChange} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
      
      fireEvent.change(input, { target: { value: 'test' } })
      expect(handleChange).not.toHaveBeenCalled()
    })

    test('respects readOnly state', () => {
      render(<Input readOnly value="readonly value" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('readOnly')
      expect(input).toHaveValue('readonly value')
    })
  })

  describe('Validation', () => {
    test('shows error message when invalid', () => {
      const { rerender } = render(<Input />)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()

      rerender(<Input error="Email is required" />)
      expect(screen.getByRole('alert')).toHaveTextContent('Email is required')
    })

    test('applies error styling when invalid', () => {
      render(<Input error="Invalid input" />)
      expect(screen.getByRole('textbox')).toHaveClass('input-error')
    })

    test('shows character count when maxLength is set', () => {
      render(<Input maxLength={50} showCharCount />)
      expect(screen.getByText('0/50')).toBeInTheDocument()
    })

    test('updates character count on input', () => {
      render(<Input maxLength={50} showCharCount />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'Hello' } })
      
      expect(screen.getByText('5/50')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('associates label with input', () => {
      render(<Input label="Username" id="username" />)
      const input = screen.getByLabelText('Username')
      expect(input).toHaveAttribute('id', 'username')
    })

    test('has correct ARIA attributes when invalid', () => {
      render(<Input error="Invalid input" aria-describedby="error-message" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', 'error-message')
    })

    test('has correct ARIA attributes when required', () => {
      render(<Input required />)
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true')
    })

    test('supports custom aria-label', () => {
      render(<Input aria-label="Custom input label" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Custom input label')
    })
  })

  describe('Controlled vs Uncontrolled', () => {
    test('works as controlled component', () => {
      const Component = () => {
        const [value, setValue] = React.useState('initial')
        return (
          <Input 
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
      render(<Input defaultValue="default" />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveValue('default')
      
      fireEvent.change(input, { target: { value: 'changed' } })
      expect(input).toHaveValue('changed')
    })
  })

  describe('Custom props', () => {
    test('passes through additional props', () => {
      render(
        <Input 
          data-testid="custom-input" 
          className="custom-class"
          autoComplete="email"
        />
      )
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('data-testid', 'custom-input')
      expect(input).toHaveClass('custom-class')
      expect(input).toHaveAttribute('autoComplete', 'email')
    })
  })
})