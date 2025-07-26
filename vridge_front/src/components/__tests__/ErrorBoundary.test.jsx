import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// 에러를 발생시키는 컴포넌트
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // 콘솔 에러 무시 (테스트 중 의도적 에러)
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  test('정상적인 자식 컴포넌트를 렌더링한다', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  test('에러 발생 시 에러 UI를 표시한다', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument();
    expect(screen.getByText('페이지를 새로고침하거나 홈으로 돌아가주세요.')).toBeInTheDocument();
  });

  test('새로고침 버튼이 작동한다', () => {
    // window.location.reload mock
    delete window.location;
    window.location = { reload: jest.fn() };

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByText('새로고침');
    fireEvent.click(refreshButton);

    expect(window.location.reload).toHaveBeenCalled();
  });

  test('홈으로 가기 버튼이 작동한다', () => {
    delete window.location;
    window.location = { href: '' };

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const homeButton = screen.getByText('홈으로 가기');
    fireEvent.click(homeButton);

    expect(window.location.href).toBe('/');
  });
});