// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom'

// Mock axios globally
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn()
}))

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    }
  }))
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />
  }
}))

// Mock window methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})

// Mock console methods to reduce noise in tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    // Filter out expected React warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') ||
       args[0].includes('Each child in a list') ||
       args[0].includes('validateDOMNesting'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
  
  console.warn = (...args) => {
    // Filter out expected warnings
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning:')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Global test utilities
global.mockLocalStorage = () => {
  const store = {}
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value }),
    removeItem: jest.fn(key => { delete store[key] }),
    clear: jest.fn(() => { Object.keys(store).forEach(key => delete store[key]) })
  }
}

// Setup localStorage mock
Object.defineProperty(window, 'localStorage', {
  value: global.mockLocalStorage()
})

// Setup sessionStorage mock
Object.defineProperty(window, 'sessionStorage', {
  value: global.mockLocalStorage()
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return [] }
}

// Mock util functions
jest.mock('./src/util/util', () => ({
  checkSession: jest.fn().mockReturnValue(true),
  axiosCredentials: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    patch: jest.fn().mockResolvedValue({ data: {} })
  })),
  getBackendUrl: jest.fn().mockReturnValue('https://api.example.com'),
  formatDate: jest.fn().mockReturnValue('2024-01-01'),
  validateEmail: jest.fn().mockReturnValue(true)
}))

// Mock API modules
jest.mock('./src/api/notification', () => ({
  GetNotifications: jest.fn().mockResolvedValue({ 
    data: { notifications: [], unread_count: 0 } 
  }),
  MarkNotificationAsRead: jest.fn().mockResolvedValue({ data: {} }),
  MarkAllNotificationsAsRead: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('./src/api/invitation', () => ({
  GetMyInvitations: jest.fn().mockResolvedValue({ 
    data: { sent: [], received: [], recent_accepted: [] } 
  }),
  AcceptInvitation: jest.fn().mockResolvedValue({ data: {} }),
  DeclineInvitation: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('./src/api/friends', () => ({
  GetFriends: jest.fn().mockResolvedValue({ data: [] }),
  GetFriendRequests: jest.fn().mockResolvedValue({ data: [] }),
  RespondToFriendRequest: jest.fn().mockResolvedValue({ data: {} }),
  SearchFriends: jest.fn().mockResolvedValue({ data: [] }),
  SendFriendRequest: jest.fn().mockResolvedValue({ data: {} }),
  DeleteFriend: jest.fn().mockResolvedValue({ data: {} }),
  BlockFriend: jest.fn().mockResolvedValue({ data: {} })
}))