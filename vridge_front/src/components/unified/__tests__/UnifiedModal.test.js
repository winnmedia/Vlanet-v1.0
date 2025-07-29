import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UnifiedModal, { ConfirmModal, InfoModal, FormModal, ImagePreviewModal } from '../UnifiedModal';

// Portal 모킹
beforeAll(() => {
  // createPortal 모킹
  const originalCreatePortal = ReactDOM.createPortal;
  ReactDOM.createPortal = (node) => node;
  
  // cleanup
  return () => {
    ReactDOM.createPortal = originalCreatePortal;
  };
});

describe('UnifiedModal', () => {
  // 기본 렌더링 테스트
  it('renders when visible', () => {
    render(
      <UnifiedModal visible title="Test Modal">
        <p>Modal content</p>
      </UnifiedModal>
    );
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  // visible false일 때 렌더링 안함
  it('does not render when not visible', () => {
    render(
      <UnifiedModal visible={false} title="Hidden Modal">
        <p>Hidden content</p>
      </UnifiedModal>
    );
    
    expect(screen.queryByText('Hidden Modal')).not.toBeInTheDocument();
  });

  // 닫기 버튼 테스트
  it('calls onCancel when close button clicked', () => {
    const handleCancel = jest.fn();
    render(
      <UnifiedModal visible onCancel={handleCancel} title="Test">
        Content
      </UnifiedModal>
    );
    
    fireEvent.click(screen.getByLabelText('닫기'));
    expect(handleCancel).toHaveBeenCalled();
  });

  // ESC 키 테스트
  it('calls onCancel when ESC pressed', () => {
    const handleCancel = jest.fn();
    render(
      <UnifiedModal visible onCancel={handleCancel} keyboard>
        Content
      </UnifiedModal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleCancel).toHaveBeenCalled();
  });

  // maskClosable 테스트
  it('calls onCancel when mask clicked if maskClosable', () => {
    const handleCancel = jest.fn();
    const { container } = render(
      <UnifiedModal visible onCancel={handleCancel} maskClosable>
        Content
      </UnifiedModal>
    );
    
    const mask = container.querySelector('.mask');
    fireEvent.click(mask);
    expect(handleCancel).toHaveBeenCalled();
  });

  // 확인/취소 버튼 테스트
  it('renders footer buttons', () => {
    const handleOk = jest.fn();
    const handleCancel = jest.fn();
    
    render(
      <UnifiedModal
        visible
        onOk={handleOk}
        onCancel={handleCancel}
        okText="저장"
        cancelText="닫기"
      >
        Content
      </UnifiedModal>
    );
    
    expect(screen.getByText('저장')).toBeInTheDocument();
    expect(screen.getByText('닫기')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('저장'));
    expect(handleOk).toHaveBeenCalled();
    
    fireEvent.click(screen.getByText('닫기'));
    expect(handleCancel).toHaveBeenCalled();
  });

  // 로딩 상태 테스트
  it('shows loading overlay when loading', () => {
    render(
      <UnifiedModal visible loading>
        Content
      </UnifiedModal>
    );
    
    expect(screen.getByLabelText('로딩 중')).toBeInTheDocument();
  });

  // confirmLoading 테스트
  it('shows loading state on ok button', () => {
    render(
      <UnifiedModal visible confirmLoading onOk={() => {}}>
        Content
      </UnifiedModal>
    );
    
    const okButton = screen.getByText('확인');
    expect(okButton).toHaveClass('loading');
    expect(okButton).toBeDisabled();
  });

  // 크기 테스트
  describe('sizes', () => {
    it('applies small width', () => {
      const { container } = render(
        <UnifiedModal visible width="small">
          Content
        </UnifiedModal>
      );
      
      const modal = container.querySelector('.modal');
      expect(modal).toHaveClass('width-small');
    });

    it('applies medium width by default', () => {
      const { container } = render(
        <UnifiedModal visible>
          Content
        </UnifiedModal>
      );
      
      const modal = container.querySelector('.modal');
      expect(modal).toHaveClass('width-medium');
    });
  });

  // centered 테스트
  it('applies centered class', () => {
    const { container } = render(
      <UnifiedModal visible centered>
        Content
      </UnifiedModal>
    );
    
    const modal = container.querySelector('.modal');
    expect(modal).toHaveClass('centered');
  });

  // destroyOnClose 테스트
  it('removes content when closed with destroyOnClose', () => {
    const { rerender } = render(
      <UnifiedModal visible destroyOnClose>
        <p>Modal content</p>
      </UnifiedModal>
    );
    
    expect(screen.getByText('Modal content')).toBeInTheDocument();
    
    rerender(
      <UnifiedModal visible={false} destroyOnClose>
        <p>Modal content</p>
      </UnifiedModal>
    );
    
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  // afterClose 콜백 테스트
  it('calls afterClose callback', async () => {
    const afterClose = jest.fn();
    const { rerender } = render(
      <UnifiedModal visible afterClose={afterClose}>
        Content
      </UnifiedModal>
    );
    
    rerender(
      <UnifiedModal visible={false} afterClose={afterClose}>
        Content
      </UnifiedModal>
    );
    
    await waitFor(() => {
      expect(afterClose).toHaveBeenCalled();
    }, { timeout: 500 });
  });
});

describe('ConfirmModal', () => {
  it('renders confirm modal with icon', () => {
    render(
      <ConfirmModal
        visible
        title="확인하시겠습니까?"
        content="이 작업은 되돌릴 수 없습니다."
        type="warning"
      />
    );
    
    expect(screen.getByText('확인하시겠습니까?')).toBeInTheDocument();
    expect(screen.getByText('이 작업은 되돌릴 수 없습니다.')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('handles confirm and cancel', () => {
    const handleConfirm = jest.fn();
    const handleCancel = jest.fn();
    
    render(
      <ConfirmModal
        visible
        content="정말 삭제하시겠습니까?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="삭제"
        cancelText="아니오"
      />
    );
    
    fireEvent.click(screen.getByText('삭제'));
    expect(handleConfirm).toHaveBeenCalled();
    
    fireEvent.click(screen.getByText('아니오'));
    expect(handleCancel).toHaveBeenCalled();
  });
});

describe('InfoModal', () => {
  it('renders info modal with single button', () => {
    const handleClose = jest.fn();
    render(
      <InfoModal
        visible
        title="알림"
        content="작업이 완료되었습니다."
        onClose={handleClose}
      />
    );
    
    expect(screen.getByText('알림')).toBeInTheDocument();
    expect(screen.getByText('작업이 완료되었습니다.')).toBeInTheDocument();
    
    // 확인 버튼만 있어야 함
    expect(screen.getByText('확인')).toBeInTheDocument();
    expect(screen.queryByText('취소')).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByText('확인'));
    expect(handleClose).toHaveBeenCalled();
  });
});

describe('FormModal', () => {
  it('renders with form content', () => {
    const mockForm = <form><input name="test" /></form>;
    
    render(
      <FormModal
        visible
        title="폼 입력"
        form={mockForm}
        submitText="제출"
      />
    );
    
    expect(screen.getByText('폼 입력')).toBeInTheDocument();
    expect(screen.getByText('제출')).toBeInTheDocument();
  });

  it('shows loading state during submission', () => {
    render(
      <FormModal
        visible
        title="폼"
        form={<div>Form</div>}
        loading
      />
    );
    
    const submitButton = screen.getByText('저장');
    expect(submitButton).toBeDisabled();
  });
});

describe('ImagePreviewModal', () => {
  const images = [
    { url: '/image1.jpg', alt: 'Image 1' },
    { url: '/image2.jpg', alt: 'Image 2' },
    { url: '/image3.jpg', alt: 'Image 3' }
  ];

  it('renders current image', () => {
    render(
      <ImagePreviewModal
        visible
        images={images}
        currentIndex={1}
      />
    );
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/image2.jpg');
    expect(img).toHaveAttribute('alt', 'Image 2');
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('handles navigation', () => {
    const handlePrev = jest.fn();
    const handleNext = jest.fn();
    
    render(
      <ImagePreviewModal
        visible
        images={images}
        currentIndex={1}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    );
    
    fireEvent.click(screen.getByLabelText('이전 이미지'));
    expect(handlePrev).toHaveBeenCalled();
    
    fireEvent.click(screen.getByLabelText('다음 이미지'));
    expect(handleNext).toHaveBeenCalled();
  });

  it('handles keyboard navigation', () => {
    const handlePrev = jest.fn();
    const handleNext = jest.fn();
    
    render(
      <ImagePreviewModal
        visible
        images={images}
        currentIndex={1}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    );
    
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(handlePrev).toHaveBeenCalled();
    
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(handleNext).toHaveBeenCalled();
  });

  it('hides navigation buttons at boundaries', () => {
    const { rerender } = render(
      <ImagePreviewModal
        visible
        images={images}
        currentIndex={0}
        onPrev={() => {}}
        onNext={() => {}}
      />
    );
    
    // 첫 번째 이미지에서는 이전 버튼 숨김
    expect(screen.queryByLabelText('이전 이미지')).not.toBeInTheDocument();
    expect(screen.getByLabelText('다음 이미지')).toBeInTheDocument();
    
    rerender(
      <ImagePreviewModal
        visible
        images={images}
        currentIndex={2}
        onPrev={() => {}}
        onNext={() => {}}
      />
    );
    
    // 마지막 이미지에서는 다음 버튼 숨김
    expect(screen.getByLabelText('이전 이미지')).toBeInTheDocument();
    expect(screen.queryByLabelText('다음 이미지')).not.toBeInTheDocument();
  });
});