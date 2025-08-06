// Redux Persist 설정
export const persistConfig = {
  key: 'vlanet-root',
  storage: localStorage,
  whitelist: ['ProjectStore', 'user'], // 저장할 리듀서
  blacklist: ['modal'], // 저장하지 않을 리듀서
  timeout: 10000,
  debug: process.env.NODE_ENV === 'development'
};