import { 
  classifyError, 
  getErrorMessage, 
  handleApiError,
  ErrorTypes,
  ErrorLogger,
  setupGlobalErrorHandlers
} from '../errorHandler';
import { showAlert } from '../../components/CustomAlert';

// showAlert 모킹
jest.mock('../../components/CustomAlert', () => ({
  showAlert: jest.fn()
}));

// 
beforeAll(() => {
  
});

afterAll(() => {
  
});

describe('errorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('classifyError', () => {
    it('classifies network errors', () => {
      const error = new Error('Network Error');
      expect(classifyError(error)).toBe(ErrorTypes.NETWORK);
    });

    it('classifies validation errors', () => {
      const error = { response: { status: 400 } };
      expect(classifyError(error)).toBe(ErrorTypes.VALIDATION);
    });

    it('classifies authentication errors', () => {
      const error = { response: { status: 401 } };
      expect(classifyError(error)).toBe(ErrorTypes.AUTHENTICATION);
    });

    it('classifies authorization errors', () => {
      const error = { response: { status: 403 } };
      expect(classifyError(error)).toBe(ErrorTypes.AUTHORIZATION);
    });

    it('classifies not found errors', () => {
      const error = { response: { status: 404 } };
      expect(classifyError(error)).toBe(ErrorTypes.NOT_FOUND);
    });

    it('classifies server errors', () => {
      const error = { response: { status: 500 } };
      expect(classifyError(error)).toBe(ErrorTypes.SERVER);
    });

    it('classifies unknown errors', () => {
      const error = { response: { status: 418 } }; // I'm a teapot
      expect(classifyError(error)).toBe(ErrorTypes.UNKNOWN);
    });
  });

  describe('getErrorMessage', () => {
    it('returns network error message', () => {
      const message = getErrorMessage(ErrorTypes.NETWORK);
      expect(message.title).toBe('네트워크 오류');
      expect(message.content).toContain('인터넷 연결을 확인해주세요');
    });

    it('returns validation error message', () => {
      const message = getErrorMessage(ErrorTypes.VALIDATION);
      expect(message.title).toBe('입력 오류');
      expect(message.content).toContain('올바른 정보를 입력했는지 확인해주세요');
    });

    it('returns authentication error message', () => {
      const message = getErrorMessage(ErrorTypes.AUTHENTICATION);
      expect(message.title).toBe('인증 필요');
      expect(message.content).toContain('다시 로그인해주세요');
    });

    it('returns custom message for specific errors', () => {
      const customError = {
        response: {
          data: {
            message: '커스텀 에러 메시지'
          }
        }
      };
      const message = getErrorMessage(ErrorTypes.VALIDATION, customError);
      expect(message.content).toBe('커스텀 에러 메시지');
    });

    it('returns error object message', () => {
      const customError = {
        response: {
          data: {
            error: '에러 객체 메시지'
          }
        }
      };
      const message = getErrorMessage(ErrorTypes.VALIDATION, customError);
      expect(message.content).toBe('에러 객체 메시지');
    });
  });

  describe('handleApiError', () => {
    it('shows alert for API errors', () => {
      const error = { response: { status: 500 } };
      handleApiError(error);
      
      expect(showAlert).toHaveBeenCalledWith({
        message: expect.any(String),
        type: 'error',
        duration: 5000
      });
    });

    it('logs error to 
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Test error');
      handleApiError(error);
      
      expect(
      
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('does not show alert when skipAlert is true', () => {
      const error = { response: { status: 404 } };
      handleApiError(error, { skipAlert: true });
      
      expect(showAlert).not.toHaveBeenCalled();
    });

    it('calls custom onError callback', () => {
      const onError = jest.fn();
      const error = { response: { status: 400 } };
      
      handleApiError(error, { onError });
      
      expect(onError).toHaveBeenCalledWith(error, ErrorTypes.VALIDATION);
    });

    it('returns error info object', () => {
      const error = { response: { status: 401 } };
      const result = handleApiError(error);
      
      expect(result).toEqual({
        type: ErrorTypes.AUTHENTICATION,
        message: expect.objectContaining({
          title: expect.any(String),
          content: expect.any(String)
        }),
        originalError: error
      });
    });
  });

  describe('ErrorLogger', () => {
    it('logs errors to localStorage', () => {
      const error = new Error('Test error');
      ErrorLogger.log(error, { context: 'test' });
      
      const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: 'Test error',
        type: ErrorTypes.UNKNOWN,
        context: 'test',
        timestamp: expect.any(String)
      });
    });

    it('limits error logs to 50 entries', () => {
      // 60개의 에러 로그 생성
      for (let i = 0; i < 60; i++) {
        ErrorLogger.log(new Error(`Error ${i}`));
      }
      
      const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      expect(logs).toHaveLength(50);
      // 최신 로그가 앞에 있어야 함
      expect(logs[0].message).toBe('Error 59');
    });

    it('retrieves error logs', () => {
      ErrorLogger.log(new Error('Error 1'));
      ErrorLogger.log(new Error('Error 2'));
      
      const logs = ErrorLogger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe('Error 2'); // 최신이 먼저
      expect(logs[1].message).toBe('Error 1');
    });

    it('clears error logs', () => {
      ErrorLogger.log(new Error('Test'));
      expect(ErrorLogger.getLogs()).toHaveLength(1);
      
      ErrorLogger.clear();
      expect(ErrorLogger.getLogs()).toHaveLength(0);
      expect(localStorage.getItem('errorLogs')).toBe('[]');
    });

    it('exports logs as formatted string', () => {
      ErrorLogger.clear();
      ErrorLogger.log(new Error('Export test'), { context: 'testing' });
      
      const exported = ErrorLogger.export();
      expect(exported).toContain('Error Logs Export');
      expect(exported).toContain('Export test');
      expect(exported).toContain('Context: testing');
    });
  });

  describe('setupGlobalErrorHandlers', () => {
    it('sets up window error handlers', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      setupGlobalErrorHandlers();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
      
      addEventListenerSpy.mockRestore();
    });

    it('handles unhandled promise rejections', () => {
      setupGlobalErrorHandlers();
      
      const error = new Error('Unhandled promise');
      const event = new Event('unhandledrejection');
      event.reason = error;
      
      window.dispatchEvent(event);
      
      expect(
      expect(showAlert).toHaveBeenCalled();
    });

    it('handles global errors', () => {
      setupGlobalErrorHandlers();
      
      const error = new Error('Global error');
      const event = new ErrorEvent('error', {
        error,
        message: error.message
      });
      
      window.dispatchEvent(event);
      
      expect(
      expect(showAlert).toHaveBeenCalled();
    });

    it('prevents duplicate error alerts', () => {
      setupGlobalErrorHandlers();
      
      const error = new Error('Duplicate error');
      
      // 같은 에러를 연속으로 발생시킴
      for (let i = 0; i < 3; i++) {
        const event = new Event('unhandledrejection');
        event.reason = error;
        window.dispatchEvent(event);
      }
      
      // showAlert는 한 번만 호출되어야 함
      const calls = showAlert.mock.calls.filter(
        call => call[0].message.includes('Duplicate error')
      );
      expect(calls).toHaveLength(1);
    });
  });

  describe('Error type specific handling', () => {
    it('handles network timeout errors', () => {
      const error = { code: 'ECONNABORTED' };
      const type = classifyError(error);
      expect(type).toBe(ErrorTypes.NETWORK);
    });

    it('handles canceled requests', () => {
      const error = { code: 'ERR_CANCELED' };
      const type = classifyError(error);
      expect(type).toBe(ErrorTypes.NETWORK);
    });

    it('handles axios network errors', () => {
      const error = { 
        isAxiosError: true,
        message: 'Network Error'
      };
      const type = classifyError(error);
      expect(type).toBe(ErrorTypes.NETWORK);
    });
  });
});