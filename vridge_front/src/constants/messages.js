/**
 * VideoPlanet 통합 메시지 시스템
 * 모든 사용자 대면 텍스트를 중앙에서 관리
 */

export const MESSAGES = {
  // 공통 메시지
  COMMON: {
    LOADING: '로딩 중...',
    SAVING: '저장하는 중...',
    SAVED: '저장했습니다',
    DELETING: '삭제하는 중...',
    DELETED: '삭제했습니다',
    CANCEL: '취소',
    CONFIRM: '확인',
    CLOSE: '닫기',
    BACK: '뒤로',
    NEXT: '다음',
    COMPLETE: '완료',
    ERROR: '오류가 발생했습니다',
    RETRY: '다시 시도',
    REQUIRED_FIELDS: '필수 정보를 모두 입력해 주세요',
    NETWORK_ERROR: '네트워크 연결을 확인해 주세요',
    SERVER_ERROR: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요',
    SESSION_EXPIRED: '세션이 만료되었습니다. 다시 로그인해 주세요',
  },

  // 로그인/회원가입
  AUTH: {
    LOGIN: {
      TITLE: '로그인',
      EMAIL_PLACEHOLDER: '이메일',
      PASSWORD_PLACEHOLDER: '비밀번호',
      SUBMIT: '로그인',
      FORGOT_PASSWORD: '비밀번호 찾기',
      NO_ACCOUNT: 'VideoPlanet이 처음이신가요?',
      SIGN_UP: '계정 만들기',
      
      // 에러 메시지
      EMPTY_EMAIL: '이메일을 입력해 주세요',
      EMPTY_PASSWORD: '비밀번호를 입력해 주세요',
      INVALID_CREDENTIALS: '이메일 또는 비밀번호를 확인해 주세요',
      EMAIL_NOT_VERIFIED: '이메일 인증이 필요합니다',
      EMAIL_NOT_VERIFIED_DESC: '가입 시 입력한 이메일 주소로 인증 메일을 발송했습니다',
      RESEND_EMAIL: '인증 메일 다시 받기',
      EMAIL_SENT: '인증 메일을 다시 보냈습니다. 이메일함을 확인해 주세요',
      EMAIL_SEND_FAILED: '인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요',
      LOGIN_SUCCESS: '로그인했습니다',
      
      // 로그인 제한
      TOO_MANY_ATTEMPTS: '너무 많은 로그인 시도로 계정이 일시적으로 잠겼습니다',
      ACCOUNT_LOCKED: (minutes) => `${minutes}분 후에 다시 시도해 주세요`,
    },
    
    SIGNUP: {
      TITLE: '계정 만들기',
      EMAIL_PLACEHOLDER: '이메일',
      PASSWORD_PLACEHOLDER: '비밀번호 (10자 이상)',
      PASSWORD_CONFIRM_PLACEHOLDER: '비밀번호 확인',
      NICKNAME_PLACEHOLDER: '닉네임',
      COMPANY_PLACEHOLDER: '회사명 (선택)',
      SUBMIT: '가입하기',
      ALREADY_MEMBER: '이미 계정이 있으신가요?',
      LOGIN: '로그인',
      
      // 약관
      TERMS_AGREE: '이용약관 및 개인정보처리방침에 동의합니다',
      MARKETING_AGREE: '마케팅 정보 수신에 동의합니다 (선택)',
      
      // 에러 메시지
      INVALID_EMAIL: '올바른 이메일 형식이 아닙니다',
      EMAIL_EXISTS: '이미 사용 중인 이메일입니다',
      WEAK_PASSWORD: '비밀번호가 너무 약합니다',
      PASSWORD_MISMATCH: '비밀번호가 일치하지 않습니다',
      NICKNAME_EXISTS: '이미 사용 중인 닉네임입니다',
      TERMS_REQUIRED: '이용약관에 동의해 주세요',
      
      // 비밀번호 강도
      PASSWORD_REQUIREMENTS: '비밀번호는 다음 조건을 만족해야 합니다:',
      PASSWORD_LENGTH: '10자 이상',
      PASSWORD_UPPERCASE: '대문자 포함',
      PASSWORD_LOWERCASE: '소문자 포함',
      PASSWORD_NUMBER: '숫자 포함',
      PASSWORD_SPECIAL: '특수문자 포함',
      
      // 성공
      SIGNUP_SUCCESS: '가입이 완료되었습니다',
      VERIFICATION_EMAIL_SENT: '인증 메일을 발송했습니다. 이메일을 확인해 주세요',
    },
  },

  // 프로젝트
  PROJECT: {
    CREATE: {
      TITLE: '새 프로젝트 만들기',
      SUBTITLE: '프로젝트 정보를 입력하고 제작 일정을 설정하세요',
      NAME_LABEL: '프로젝트명',
      NAME_PLACEHOLDER: '프로젝트 이름을 입력하세요',
      MANAGER_LABEL: '담당자',
      MANAGER_PLACEHOLDER: '담당자 이름을 입력하세요',
      CLIENT_LABEL: '클라이언트',
      CLIENT_PLACEHOLDER: '클라이언트 이름을 입력하세요',
      DESCRIPTION_LABEL: '프로젝트 설명',
      DESCRIPTION_PLACEHOLDER: '프로젝트에 대한 간단한 설명을 입력하세요',
      SCHEDULE_TITLE: '프로젝트 일정',
      FILES_TITLE: '참고 자료',
      UPLOAD_FILE: '파일 추가',
      SUBMIT: '프로젝트 만들기',
      CREATING: '프로젝트를 만들고 있습니다...',
      
      // 에러/성공
      DUPLICATE_NAME: '이미 사용 중인 프로젝트 이름입니다. 다른 이름을 입력해 주세요',
      CREATE_SUCCESS: '프로젝트를 만들었습니다',
      CREATE_ERROR: '프로젝트를 만들 수 없습니다. 다시 시도해 주세요',
    },
    
    LIST: {
      TITLE: '프로젝트',
      EMPTY: '아직 프로젝트가 없습니다',
      EMPTY_DESC: '새 프로젝트를 만들어 시작하세요',
      CREATE_NEW: '새 프로젝트',
      FILTER_ALL: '전체',
      FILTER_ACTIVE: '진행 중',
      FILTER_COMPLETED: '완료됨',
      
      // 프로젝트 카드
      MANAGER: '담당자',
      CLIENT: '클라이언트',
      DEADLINE: '마감일',
      PROGRESS: '진행률',
      MEMBERS: (count) => `멤버 ${count}명`,
      LAST_ACTIVITY: '최근 활동',
    },
    
    PHASES: {
      BASIC_PLAN: '기획',
      STORY_BOARD: '스토리보드',
      FILMING: '촬영',
      VIDEO_EDIT: '편집',
      POST_WORK: '후반작업',
      VIDEO_PREVIEW: '시사',
      CONFIRMATION: '컨펌',
      VIDEO_DELIVERY: '납품',
      
      // 상태
      NOT_STARTED: '시작 전',
      IN_PROGRESS: '진행 중',
      COMPLETED: '완료',
      DELAYED: '지연',
    },
  },

  // 영상 기획
  VIDEO_PLANNING: {
    TITLE: '영상 기획',
    SUBTITLE: 'AI가 도와드리는 영상 기획',
    
    STEP1: {
      TITLE: '기본 정보',
      VIDEO_TYPE: '영상 종류',
      TARGET_AUDIENCE: '타겟 고객',
      TARGET_PLACEHOLDER: '예: 20-30대 직장인',
      KEY_MESSAGE: '핵심 메시지',
      KEY_MESSAGE_PLACEHOLDER: '영상을 통해 전달하고 싶은 핵심 메시지를 입력하세요',
      STORY_FRAMEWORK: '스토리 구성',
      CHARACTER_SETTING: '주인공 설정',
      CHARACTER_NAME: '주인공 이름',
      CHARACTER_DESC: '주인공 설명',
      CHARACTER_DESC_PLACEHOLDER: '주인공의 특징, 성격, 배경 등을 입력하세요',
    },
    
    STEP2: {
      TITLE: '스토리 생성',
      GENERATING: 'AI가 스토리를 만들고 있습니다...',
      REGENERATE: '다시 생성',
      SELECT_STORY: '스토리 선택',
      SELECTED: '선택됨',
      
      // 스토리 프레임워크
      FRAMEWORK: {
        CLASSIC: '기승전결',
        HOOK_IMMERSION: '훅/몰입/반전/떡밥',
        PIXAR: 'Pixar 스토리텔링',
        SAVE_THE_CAT: 'Save the Cat',
        STAR_MOMENT: '스타 모멘트',
      },
    },
    
    STEP3: {
      TITLE: '씬 구성',
      SCENE: (number) => `씬 ${number}`,
      LOCATION: '장소',
      TIME: '시간',
      DESCRIPTION: '설명',
      INSERT_SHOTS: '인서트샷',
      GENERATE_SHOTS: '인서트샷 생성',
      GENERATING_SHOTS: '인서트샷을 생성하는 중...',
      ADD_SCENE: '씬 추가',
      DELETE_SCENE: '씬 삭제',
    },
    
    EXPORT: {
      TITLE: '내보내기',
      PDF: 'PDF로 내보내기',
      PPT: 'PPT로 내보내기',
      SHARE: '공유하기',
      EXPORTING: '파일을 생성하는 중...',
      EXPORT_SUCCESS: '파일을 다운로드했습니다',
      EXPORT_ERROR: '파일 생성에 실패했습니다',
    },
  },

  // 피드백
  FEEDBACK: {
    TITLE: '피드백',
    SUBTITLE: '영상에 대한 의견을 남겨주세요',
    
    INPUT: {
      MODE_LABEL: '작성자 표시',
      MODE_ANONYMOUS: '익명으로 남기기',
      MODE_NICKNAME: '닉네임으로 남기기',
      MODE_REALNAME: '실명으로 남기기',
      NICKNAME_PLACEHOLDER: '닉네임 입력 (최대 20자)',
      TIME_LABEL: '시간',
      TIME_PLACEHOLDER: '00:00 (자동 입력됨)',
      TIME_HELP: '영상의 현재 재생 시간이 자동으로 입력됩니다',
      CONTENT_LABEL: '내용',
      CONTENT_PLACEHOLDER: '영상에 대한 의견을 자유롭게 작성해 주세요',
      SUBMIT: '피드백 남기기',
      
      // 에러/성공
      EMPTY_NICKNAME: '닉네임을 입력해 주세요',
      EMPTY_FIELDS: '시간과 내용을 모두 입력해 주세요',
      CREATE_SUCCESS: '피드백을 등록했습니다',
      CREATE_ERROR: '피드백을 등록할 수 없습니다. 다시 시도해 주세요',
    },
    
    LIST: {
      EMPTY: '아직 피드백이 없습니다',
      EMPTY_DESC: '첫 번째 피드백을 남겨주세요',
      SORT_TIME: '시간순',
      SORT_LATEST: '최신순',
      FILTER_ALL: '전체',
      FILTER_IMPORTANT: '중요',
      FILTER_RESOLVED: '해결됨',
      
      // 피드백 카드
      REPLY: '답글',
      MARK_IMPORTANT: '중요 표시',
      MARK_RESOLVED: '해결됨 표시',
      DELETE: '삭제',
      EDIT: '수정',
    },
  },

  // 캘린더
  CALENDAR: {
    TITLE: '전체 일정',
    VIEW_MONTH: '월',
    VIEW_WEEK: '주',
    VIEW_DAY: '일',
    TODAY: '오늘',
    
    // 프로젝트 필터
    FILTER_TITLE: '프로젝트 필터',
    SELECT_ALL: '전체 선택',
    DESELECT_ALL: '전체 해제',
    
    // 이벤트
    EVENT_DETAILS: '일정 상세',
    ADD_MEMO: '메모 추가',
    EDIT_SCHEDULE: '일정 수정',
  },

  // 마이페이지
  MYPAGE: {
    TITLE: '마이페이지',
    PROFILE: '프로필',
    EDIT_PROFILE: '프로필 수정',
    CHANGE_PASSWORD: '비밀번호 변경',
    NOTIFICATIONS: '알림 설정',
    LOGOUT: '로그아웃',
    
    PROFILE_EDIT: {
      TITLE: '프로필 수정',
      PROFILE_IMAGE: '프로필 이미지',
      CHANGE_IMAGE: '이미지 변경',
      REMOVE_IMAGE: '이미지 삭제',
      NICKNAME: '닉네임',
      EMAIL: '이메일',
      COMPANY: '회사',
      POSITION: '직책',
      PHONE: '연락처',
      BIO: '소개',
      SAVE: '저장',
      SAVING: '저장하는 중...',
      SAVE_SUCCESS: '프로필을 업데이트했습니다',
      SAVE_ERROR: '프로필 업데이트에 실패했습니다',
    },
  },

  // 알림
  NOTIFICATION: {
    NEW: '새 알림',
    MARK_ALL_READ: '모두 읽음 표시',
    EMPTY: '새로운 알림이 없습니다',
    
    TYPES: {
      PROJECT_INVITE: (projectName) => `'${projectName}' 프로젝트에 초대되었습니다`,
      PROJECT_UPDATE: (projectName) => `'${projectName}' 프로젝트가 업데이트되었습니다`,
      FEEDBACK_REPLY: (userName) => `${userName}님이 회신을 남겼습니다`,
      DEADLINE_REMINDER: (projectName, days) => `'${projectName}' 마감 ${days}일 전입니다`,
    },
  },

  // 에러 페이지
  ERROR_PAGES: {
    404: {
      TITLE: '페이지를 찾을 수 없습니다',
      DESC: '요청하신 페이지가 존재하지 않거나 이동되었습니다',
      ACTION: '홈으로 가기',
    },
    500: {
      TITLE: '서버 오류가 발생했습니다',
      DESC: '일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요',
      ACTION: '새로고침',
    },
    OFFLINE: {
      TITLE: '인터넷 연결을 확인해 주세요',
      DESC: '네트워크에 연결되어 있지 않습니다',
      ACTION: '다시 시도',
    },
  },
};

// 메시지 헬퍼 함수
export const getMessage = (path, ...args) => {
  const keys = path.split('.');
  let message = MESSAGES;
  
  for (const key of keys) {
    message = message[key];
    if (!message) {
      
      return path;
    }
  }
  
  // 함수인 경우 인자 전달
  if (typeof message === 'function') {
    return message(...args);
  }
  
  return message;
};

// 에러 메시지 포맷터
export const formatError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return MESSAGES.COMMON.ERROR;
};

// 성공 메시지 포맷터
export const formatSuccess = (action) => {
  const successMessages = {
    create: '만들었습니다',
    update: '수정했습니다',
    delete: '삭제했습니다',
    save: '저장했습니다',
    send: '전송했습니다',
    upload: '업로드했습니다',
    download: '다운로드했습니다',
  };
  
  return successMessages[action] || '완료했습니다';
};