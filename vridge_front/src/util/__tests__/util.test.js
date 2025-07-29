import {
  checkSession,
  refetchProject,
  formatDate,
  formatNumber,
  truncateText,
  debounce,
  throttle
} from '../util';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

describe('Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReset();
  });

  describe('checkSession', () => {
    it('returns true when valid token exists', () => {
      localStorageMock.getItem.mockReturnValue('valid-token-123');
      expect(checkSession()).toBe(true);
    });

    it('returns false when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(checkSession()).toBe(false);
    });

    it('checks the correct localStorage key', () => {
      checkSession();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
    });
  });

  describe('formatDate', () => {
    it('formats date correctly in Korean format', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('2024년 1월 15일');
    });

    it('handles string date input', () => {
      expect(formatDate('2024-01-15')).toBe('2024년 1월 15일');
    });

    it('returns empty string for invalid date', () => {
      expect(formatDate('invalid')).toBe('');
    });
  });

  describe('formatNumber', () => {
    it('formats number with thousand separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('handles decimal numbers', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
    });

    it('handles negative numbers', () => {
      expect(formatNumber(-1000)).toBe('-1,000');
    });

    it('returns 0 for invalid input', () => {
      expect(formatNumber('invalid')).toBe('0');
    });
  });

  describe('truncateText', () => {
    it('truncates long text with ellipsis', () => {
      const longText = 'This is a very long text that needs to be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long...');
    });

    it('returns original text if shorter than limit', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe('Short text');
    });

    it('handles empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('handles custom ellipsis', () => {
      expect(truncateText('Long text here', 9, '…')).toBe('Long text…');
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('delays function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(499);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('cancels previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn();
      jest.advanceTimersByTime(200);
      debouncedFn();
      jest.advanceTimersByTime(200);
      debouncedFn();
      jest.advanceTimersByTime(500);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    it('limits function execution rate', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 500);

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      throttledFn();
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('refetchProject', () => {
    it('calls the API with correct headers', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: [] })
      });

      await refetchProject();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('handles API errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await refetchProject();
      expect(result).toBeNull();
    });
  });
});