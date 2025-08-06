// 피드백 상태
export const FEEDBACK_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  IN_PROGRESS: 'in_progress',
  ARCHIVED: 'archived'
}

// 피드백 반응 타입
export const FEEDBACK_REACTIONS = {
  LIKE: 'like',
  DISLIKE: 'dislike',
  NEED_EXPLANATION: 'needExplanation'
}

// 피드백 표시 모드
export const FEEDBACK_DISPLAY_MODES = {
  ANONYMOUS: 'anonymous',
  NICKNAME: 'nickname',
  REALNAME: 'realname'
}

// 피드백 정렬 옵션
export const FEEDBACK_SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  TIME_ASC: 'timeAsc',
  TIME_DESC: 'timeDesc',
  MOST_REACTIONS: 'mostReactions'
}

// 피드백 필터 옵션
export const FEEDBACK_FILTER_OPTIONS = {
  ALL: 'all',
  WITH_TIME: 'withTime',
  WITHOUT_TIME: 'withoutTime',
  MY_FEEDBACK: 'myFeedback',
  OTHERS_FEEDBACK: 'othersFeedback'
}

// 피드백 액션
export const FEEDBACK_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  REACT: 'react',
  BULK_DELETE: 'bulkDelete',
  BULK_COMPLETE: 'bulkComplete',
  BULK_PENDING: 'bulkPending'
}

// 피드백 이벤트
export const FEEDBACK_EVENTS = {
  CREATED: 'feedback:created',
  UPDATED: 'feedback:updated',
  DELETED: 'feedback:deleted',
  REACTION_CHANGED: 'feedback:reactionChanged',
  STATUS_CHANGED: 'feedback:statusChanged'
}

// 피드백 에러 메시지
export const FEEDBACK_ERROR_MESSAGES = {
  CREATE_FAILED: '피드백 등록에 실패했습니다.',
  UPDATE_FAILED: '피드백 수정에 실패했습니다.',
  DELETE_FAILED: '피드백 삭제에 실패했습니다.',
  LOAD_FAILED: '피드백을 불러오는데 실패했습니다.',
  REACTION_FAILED: '반응 업데이트에 실패했습니다.',
  PERMISSION_DENIED: '권한이 없습니다.',
  INVALID_TIME_FORMAT: '올바른 시간 형식이 아닙니다. (예: 01분 30초)',
  EMPTY_CONTENT: '피드백 내용을 입력해주세요.',
  EMPTY_NICKNAME: '닉네임을 입력해주세요.'
}

// 피드백 성공 메시지
export const FEEDBACK_SUCCESS_MESSAGES = {
  CREATED: '피드백이 등록되었습니다.',
  UPDATED: '피드백이 수정되었습니다.',
  DELETED: '피드백이 삭제되었습니다.',
  REACTION_UPDATED: '반응이 업데이트되었습니다.',
  STATUS_UPDATED: '상태가 변경되었습니다.',
  BULK_DELETED: '선택한 피드백이 삭제되었습니다.',
  BULK_COMPLETED: '선택한 피드백이 완료 처리되었습니다.'
}

// 피드백 확인 메시지
export const FEEDBACK_CONFIRM_MESSAGES = {
  DELETE: '정말 이 피드백을 삭제하시겠습니까?',
  BULK_DELETE: '선택한 피드백을 모두 삭제하시겠습니까?',
  UNSAVED_CHANGES: '저장하지 않은 변경사항이 있습니다. 계속하시겠습니까?'
}

// 피드백 플레이스홀더
export const FEEDBACK_PLACEHOLDERS = {
  SEARCH: '피드백 검색...',
  CONTENT: '피드백 내용을 입력하세요',
  TIME: '00분 00초',
  NICKNAME: '사용할 닉네임을 입력하세요'
}

// 피드백 도움말
export const FEEDBACK_HELP_TEXTS = {
  TIME_INPUT: '현재 영상 시간이 자동으로 입력됩니다',
  ANONYMOUS_MODE: '작성자 정보가 표시되지 않습니다',
  NICKNAME_MODE: '설정한 닉네임으로 표시됩니다',
  REALNAME_MODE: '실명으로 표시됩니다'
}