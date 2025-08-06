import { showAlert, customConfirm } from '../components/CustomAlert'
import { message } from 'antd'

// window.alert를 커스텀 알림으로 대체
export const alert = (message, type = 'info') => {
  showAlert(message, type, 0, [
    { text: '확인', primary: true, onClick: () => {} }
  ])
}

// window.confirm을 커스텀 확인창으로 대체
export const confirm = customConfirm

// 성공 알림
export const alertSuccess = (message) => {
  showAlert(message, 'success', 3000)
}

// 에러 알림
export const alertError = (message) => {
  showAlert(message, 'error', 4000)
}

// 경고 알림
export const alertWarning = (message) => {
  showAlert(message, 'warning', 3500)
}

// 정보 알림
export const alertInfo = (message) => {
  showAlert(message, 'info', 3000)
}