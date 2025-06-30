import axios from 'axios'
import { updateProjectStore } from 'redux/project'
import { ProjectList } from 'api/project'
import moment from 'moment'
import 'moment/locale/ko'

export function axiosOpts(method, url, data, config) {
  return {
    method: method,
    url: url,
    data: data,
    withCredentials: true,
    crossDomain: true,
    ...config,
  }
}

export function axiosCredentials(method, url, data, config) {
  let token = checkSession();
  
  // 토큰에서 따옴표 제거 (안전을 위해)
  if (token && typeof token === 'string' && token.includes('"')) {
    token = token.replace(/"/g, '');
  }
  
  console.log('Token for request:', token); // 디버깅용
  
  // checkSession returns the jwt token directly now (it's a string, not an object)
  const axiosConfig = {
    method: method,
    url: url,
    data: data,
    withCredentials: true,
    timeout: config?.timeout || 30000,
    crossDomain: true,
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...config?.headers
    },
    ...config,
  };
  
  console.log('Axios config:', axiosConfig); // 디버깅용
  
  return axios(axiosConfig).catch(error => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  });
}

export function checkSession() {
  let session = window.localStorage.getItem('VGID')
  if (session) {
    try {
      // Try to parse if it's JSON (for backward compatibility)
      session = JSON.parse(session)
    } catch (e) {
      // If parsing fails, it's already a plain string token
      // Remove quotes if they exist
      if (session.startsWith('"') && session.endsWith('"')) {
        session = session.slice(1, -1)
      }
    }
  }
  return session
}

export function refetchProject(dispatch, navigate) {
  if (checkSession()) {
    const date = new Date()
    return ProjectList()
      .then((res) => {
        const data = res.data.result
        const result = data.sort((a, b) => {
          return new Date(b.created) - new Date(a.created)
        })
        // const current_project_list = result.filter((i) => {
        //   console.log(i.end_date)
        //   console.log(new Date())
        //   return new Date(i.end_date) >= new Date()
        // })
        const current_month = date.getMonth() + 1
        const this_month_project = result.filter(
          (i, index) =>
            moment(i.first_date).format('M') == current_month ||
            moment(i.end_date).format('M') == current_month,
        )
        const next_month_project = result.filter(
          (i, index) =>
            moment(i.first_date).format('M') == current_month + 1 ||
            moment(i.end_date).format('M') == current_month + 1,
        )
        dispatch(
          updateProjectStore({
            user: res.data.user,
            nickname: res.data.nickname,
            sample_files: res.data.sample_files,
            project_list: result,
            this_month_project: this_month_project,
            next_month_project: next_month_project,
            user_memos: res.data.user_memos,
          }),
        )
        return res
      })
      .catch((error) => {
        console.log(error)
        if (
          error.response &&
          error.response.data &&
          error.response.data.message === 'NEED_ACCESS_TOKEN'
        ) {
          window.localStorage.removeItem('VGID')
          // navigate를 제거하고 PageTemplate에서 처리하도록 함
          // navigate('/Login', { replace: true })
        }
        throw error
      })
  }
  return Promise.resolve()
}

export function project_initial(current_project) {
  if (current_project) {
    return {
      name: current_project.name,
      description: current_project.description,
      manager: current_project.manager,
      consumer: current_project.consumer,
    }
  } else {
    return {
      name: '',
      description: '',
      manager: '',
      consumer: '',
    }
  }
}

export function project_dateRange(current_project) {
  if (current_project) {
    return [
      {
        text: '기초 기획안 작성',
        startDate: current_project.basic_plan.start_date,
        endDate: current_project.basic_plan.end_date,
        key: 'basic_plan',
      },
      {
        text: '스토리보드 작성',
        startDate: current_project.story_board.start_date,
        endDate: current_project.story_board.end_date,
        key: 'story_board',
      },
      {
        text: '촬영(계획/진행)',
        startDate: current_project.filming.start_date,
        endDate: current_project.filming.end_date,
        key: 'filming',
      },
      {
        text: '비디오 편집',
        startDate: current_project.video_edit.start_date,
        endDate: current_project.video_edit.end_date,
        key: 'video_edit',
      },
      {
        text: '후반 작업',
        startDate: current_project.post_work.start_date,
        endDate: current_project.post_work.end_date,
        key: 'post_work',
      },
      {
        text: '비디오 시사(피드백)',
        startDate: current_project.video_preview.start_date,
        endDate: current_project.video_preview.end_date,
        key: 'video_preview',
      },
      {
        text: '최종 컨펌',
        startDate: current_project.confirmation.start_date,
        endDate: current_project.confirmation.end_date,
        key: 'confirmation',
      },
      {
        text: '영상 납품',
        startDate: current_project.video_delivery.start_date,
        endDate: current_project.video_delivery.end_date,
        key: 'video_delivery',
      },
    ]
  } else {
    return [
      {
        text: '기초 기획안 작성',
        startDate: null,
        endDate: null,
        key: 'basic_plan',
      },
      {
        text: '스토리보드 작성',
        startDate: null,
        endDate: null,
        key: 'story_board',
      },
      {
        text: '촬영(계획/진행)',
        startDate: null,
        endDate: null,
        key: 'filming',
      },
      {
        text: '비디오 편집',
        startDate: null,
        endDate: null,
        key: 'video_edit',
      },
      { text: '후반 작업', startDate: null, endDate: null, key: 'post_work' },
      {
        text: '비디오 시사(피드백)',
        startDate: null,
        endDate: null,
        key: 'video_preview',
      },
      {
        text: '최종 컨펌',
        startDate: null,
        endDate: null,
        key: 'confirmation',
      },
      {
        text: '영상 납품',
        startDate: null,
        endDate: null,
        key: 'video_delivery',
      },
    ]
  }
}

export function MonthCalendar(year, month) {
  const firstDay = new Date(year, month - 1, 1)

  const startingDay = firstDay.getDay()

  const numRows = 6 // 최대 6주 표시
  const numCols = 7 // 요일 수

  let row = []
  let col = []
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      if (i === 0 && j < startingDay) {
        // 이번 달 시작 전의 빈 칸
        col.push('')
      } else {
        // 날짜 표시
        const day = i * numCols + j - startingDay + 1
        if (day > 0 && day <= new Date(year, month, 0).getDate()) {
          col.push(day)
        }
      }
    }
    row.push(col)
    col = []
  }
  row = row.filter((i) => i.length > 0)
  return row
}
