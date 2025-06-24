import { axiosOpts, axiosCredentials } from 'util/util'

// 피드백 detail
export function OnlineListAPI() {
  return axiosCredentials(
    'get',
    `${process.env.REACT_APP_BACKEND_API_URL}/onlines/`,
  )
}
