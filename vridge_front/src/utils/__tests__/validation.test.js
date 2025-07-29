import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateUrl,
  validateNumber,
  validateFileSize,
  validateFileType
} from '../validation'

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    test('validates correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.kr')).toBe(true)
      expect(validateEmail('user+tag@example.com')).toBe(true)
      expect(validateEmail('user_123@sub.domain.com')).toBe(true)
    })

    test('rejects invalid email formats', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('user@.com')).toBe(false)
      expect(validateEmail('user@domain')).toBe(false)
      expect(validateEmail('user @example.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
      expect(validateEmail(null)).toBe(false)
      expect(validateEmail(undefined)).toBe(false)
    })
  })

  describe('validatePassword', () => {
    test('validates correct password formats', () => {
      expect(validatePassword('password123')).toBe(true)
      expect(validatePassword('StrongP@ss1')).toBe(true)
      expect(validatePassword('123456')).toBe(true)
      expect(validatePassword('abcdef')).toBe(true)
    })

    test('rejects invalid passwords', () => {
      expect(validatePassword('12345')).toBe(false) // Too short
      expect(validatePassword('')).toBe(false)
      expect(validatePassword(null)).toBe(false)
      expect(validatePassword(undefined)).toBe(false)
    })

    test('validates with custom min length', () => {
      expect(validatePassword('12345678', { minLength: 8 })).toBe(true)
      expect(validatePassword('1234567', { minLength: 8 })).toBe(false)
    })

    test('validates with complexity requirements', () => {
      const options = {
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: true
      }
      
      expect(validatePassword('Test123!', options)).toBe(true)
      expect(validatePassword('test123!', options)).toBe(false) // No uppercase
      expect(validatePassword('TEST123!', options)).toBe(false) // No lowercase
      expect(validatePassword('TestABC!', options)).toBe(false) // No number
      expect(validatePassword('Test1234', options)).toBe(false) // No special char
    })
  })

  describe('validatePhone', () => {
    test('validates Korean phone numbers', () => {
      expect(validatePhone('010-1234-5678')).toBe(true)
      expect(validatePhone('01012345678')).toBe(true)
      expect(validatePhone('010 1234 5678')).toBe(true)
      expect(validatePhone('02-123-4567')).toBe(true)
      expect(validatePhone('031-123-4567')).toBe(true)
    })

    test('rejects invalid phone numbers', () => {
      expect(validatePhone('123456')).toBe(false)
      expect(validatePhone('010-123-456')).toBe(false) // Too short
      expect(validatePhone('010-1234-56789')).toBe(false) // Too long
      expect(validatePhone('abc-1234-5678')).toBe(false)
      expect(validatePhone('')).toBe(false)
    })
  })

  describe('validateRequired', () => {
    test('validates non-empty values', () => {
      expect(validateRequired('value')).toBe(true)
      expect(validateRequired(123)).toBe(true)
      expect(validateRequired(0)).toBe(true)
      expect(validateRequired(false)).toBe(true)
      expect(validateRequired(['item'])).toBe(true)
      expect(validateRequired({ key: 'value' })).toBe(true)
    })

    test('rejects empty values', () => {
      expect(validateRequired('')).toBe(false)
      expect(validateRequired('   ')).toBe(false) // Only whitespace
      expect(validateRequired(null)).toBe(false)
      expect(validateRequired(undefined)).toBe(false)
      expect(validateRequired([])).toBe(false)
      expect(validateRequired({})).toBe(false)
    })
  })

  describe('validateMinLength', () => {
    test('validates strings with minimum length', () => {
      expect(validateMinLength('hello', 3)).toBe(true)
      expect(validateMinLength('hello', 5)).toBe(true)
      expect(validateMinLength('hello world', 5)).toBe(true)
    })

    test('rejects strings shorter than minimum', () => {
      expect(validateMinLength('hi', 3)).toBe(false)
      expect(validateMinLength('', 1)).toBe(false)
      expect(validateMinLength(null, 1)).toBe(false)
    })

    test('validates arrays with minimum length', () => {
      expect(validateMinLength([1, 2, 3], 2)).toBe(true)
      expect(validateMinLength([1], 2)).toBe(false)
    })
  })

  describe('validateMaxLength', () => {
    test('validates strings within maximum length', () => {
      expect(validateMaxLength('hello', 10)).toBe(true)
      expect(validateMaxLength('hello', 5)).toBe(true)
      expect(validateMaxLength('', 5)).toBe(true)
    })

    test('rejects strings longer than maximum', () => {
      expect(validateMaxLength('hello world', 5)).toBe(false)
      expect(validateMaxLength('toolong', 5)).toBe(false)
    })
  })

  describe('validateUrl', () => {
    test('validates correct URL formats', () => {
      expect(validateUrl('https://example.com')).toBe(true)
      expect(validateUrl('http://subdomain.example.com')).toBe(true)
      expect(validateUrl('https://example.com/path/to/page')).toBe(true)
      expect(validateUrl('https://example.com:8080')).toBe(true)
      expect(validateUrl('https://example.com?param=value')).toBe(true)
    })

    test('rejects invalid URLs', () => {
      expect(validateUrl('not a url')).toBe(false)
      expect(validateUrl('example.com')).toBe(false) // No protocol
      expect(validateUrl('ftp://example.com')).toBe(false) // Wrong protocol
      expect(validateUrl('https://')).toBe(false)
      expect(validateUrl('')).toBe(false)
    })
  })

  describe('validateNumber', () => {
    test('validates numeric values', () => {
      expect(validateNumber(123)).toBe(true)
      expect(validateNumber(0)).toBe(true)
      expect(validateNumber(-123)).toBe(true)
      expect(validateNumber(123.45)).toBe(true)
      expect(validateNumber('123')).toBe(true)
      expect(validateNumber('123.45')).toBe(true)
    })

    test('rejects non-numeric values', () => {
      expect(validateNumber('abc')).toBe(false)
      expect(validateNumber('123abc')).toBe(false)
      expect(validateNumber('')).toBe(false)
      expect(validateNumber(null)).toBe(false)
      expect(validateNumber(undefined)).toBe(false)
      expect(validateNumber(NaN)).toBe(false)
    })

    test('validates with min/max constraints', () => {
      expect(validateNumber(5, { min: 0, max: 10 })).toBe(true)
      expect(validateNumber(0, { min: 0, max: 10 })).toBe(true)
      expect(validateNumber(10, { min: 0, max: 10 })).toBe(true)
      expect(validateNumber(-1, { min: 0, max: 10 })).toBe(false)
      expect(validateNumber(11, { min: 0, max: 10 })).toBe(false)
    })
  })

  describe('validateFileSize', () => {
    test('validates file size within limits', () => {
      const file = { size: 1024 * 1024 } // 1MB
      expect(validateFileSize(file, 2 * 1024 * 1024)).toBe(true) // 2MB limit
      expect(validateFileSize(file, 1024 * 1024)).toBe(true) // Exact size
    })

    test('rejects files exceeding size limit', () => {
      const file = { size: 3 * 1024 * 1024 } // 3MB
      expect(validateFileSize(file, 2 * 1024 * 1024)).toBe(false) // 2MB limit
    })

    test('handles invalid inputs', () => {
      expect(validateFileSize(null, 1024)).toBe(false)
      expect(validateFileSize({}, 1024)).toBe(false)
      expect(validateFileSize({ size: null }, 1024)).toBe(false)
    })
  })

  describe('validateFileType', () => {
    test('validates allowed file types', () => {
      const imageFile = { type: 'image/jpeg', name: 'photo.jpg' }
      const pdfFile = { type: 'application/pdf', name: 'document.pdf' }
      
      expect(validateFileType(imageFile, ['image/jpeg', 'image/png'])).toBe(true)
      expect(validateFileType(pdfFile, ['application/pdf'])).toBe(true)
    })

    test('validates by file extension', () => {
      const file = { name: 'document.pdf' }
      expect(validateFileType(file, ['.pdf', '.doc'])).toBe(true)
    })

    test('rejects disallowed file types', () => {
      const file = { type: 'text/plain', name: 'file.txt' }
      expect(validateFileType(file, ['image/jpeg', 'image/png'])).toBe(false)
      expect(validateFileType(file, ['.pdf', '.doc'])).toBe(false)
    })

    test('handles invalid inputs', () => {
      expect(validateFileType(null, ['.pdf'])).toBe(false)
      expect(validateFileType({}, ['.pdf'])).toBe(false)
      expect(validateFileType({ name: 'file' }, ['.pdf'])).toBe(false)
    })
  })
})