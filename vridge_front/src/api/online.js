import { axiosOpts, axiosCredentials } from 'util/util'

// 피드백 detail
export function OnlineListAPI() {
  return axiosCredentials(
    'get',
    `/onlines/`,
  )
}
