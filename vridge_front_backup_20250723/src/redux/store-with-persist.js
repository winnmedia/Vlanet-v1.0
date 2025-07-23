import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

// Import your reducers
import ProjectStore from './modules/ProjectStore';
import userReducer from './modules/user';
import modalReducer from './modules/modal';

// Persist config
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['ProjectStore', 'user'] // 저장할 리듀서 선택
};

// Combine reducers
const rootReducer = combineReducers({
  ProjectStore,
  user: userReducer,
  modal: modalReducer
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
});

export const persistor = persistStore(store);
export default store;