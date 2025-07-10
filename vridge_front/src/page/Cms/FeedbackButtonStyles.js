// 피드백 페이지 버튼 스타일
// 인라인 스타일 대신 사용할 스타일 객체

export const feedbackButtonStyles = {
  primary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(22, 49, 248, 0.25)'
  },
  
  danger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(220, 53, 69, 0.25)'
  },
  
  secondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(108, 117, 125, 0.25)'
  },
  
  outline: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'white',
    color: '#1631F8',
    border: '2px solid #1631F8',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  
  toggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#f8f9fa',
    color: '#495057',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
}

// 버튼 호버 이벤트 핸들러
export const handleButtonHover = (e, type) => {
  if (type === 'primary') {
    e.currentTarget.style.transform = 'translateY(-2px)'
    e.currentTarget.style.boxShadow = '0 6px 20px rgba(22, 49, 248, 0.4)'
  } else if (type === 'danger') {
    e.currentTarget.style.transform = 'translateY(-2px)'
    e.currentTarget.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)'
  } else if (type === 'secondary') {
    e.currentTarget.style.transform = 'translateY(-2px)'
    e.currentTarget.style.boxShadow = '0 6px 20px rgba(108, 117, 125, 0.4)'
  } else if (type === 'outline') {
    e.currentTarget.style.background = '#1631F8'
    e.currentTarget.style.color = 'white'
    e.currentTarget.style.transform = 'translateY(-2px)'
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 49, 248, 0.3)'
  } else if (type === 'toggle') {
    e.currentTarget.style.background = '#e9ecef'
    e.currentTarget.style.color = '#212529'
  }
}

// 버튼 호버 해제 핸들러
export const handleButtonLeave = (e, type) => {
  if (type === 'primary' || type === 'danger' || type === 'secondary') {
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.boxShadow = feedbackButtonStyles[type].boxShadow
  } else if (type === 'outline') {
    e.currentTarget.style.background = 'white'
    e.currentTarget.style.color = '#1631F8'
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.boxShadow = 'none'
  } else if (type === 'toggle') {
    e.currentTarget.style.background = '#f8f9fa'
    e.currentTarget.style.color = '#495057'
  }
}