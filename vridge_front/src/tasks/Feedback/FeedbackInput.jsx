import useInput from 'hooks/UseInput'
import React, { useState, useEffect } from 'react'

import { CreateFeedback } from 'api/feedback'

export default function FeedbackInput({ project_id, refetch, initialTime, onTimeChange }) {
  const initial = {
    secret: 'true',
    title: '',
    section: initialTime || '',
    contents: '',
  }

  const { inputs, onChange, set_inputs } = useInput(initial)
  const { secret, section, contents } = inputs
  const [isAnonymousChecked, setIsAnonymousChecked] = useState(true)
  
  // initialTime이 변경될 때 section 값 업데이트
  useEffect(() => {
    if (initialTime) {
      set_inputs(prevInputs => ({
        ...prevInputs,
        section: initialTime
      }))
    }
  }, [initialTime, set_inputs])

  function SendFeedback() {
    console.log('SendFeedback called with inputs:', inputs)
    console.log('Project ID:', project_id)
    
    if (secret && section && contents) {
      console.log('Sending feedback data:', {
        secret,
        section,
        contents,
        project_id
      })
      
      CreateFeedback(inputs, project_id)
        .then((res) => {
          console.log('Feedback creation success:', res)
          window.alert('피드백 등록이 되었습니다.')
          set_inputs({
            secret: 'true',
            title: '',
            section: '',
            contents: '',
          })
          setIsAnonymousChecked(true)
          // 시간 초기화 콜백 호출
          if (onTimeChange) {
            onTimeChange('')
          }
          refetch()
        })
        .catch((err) => {
          console.error('Feedback creation error:', err)
          console.error('Error response:', err.response)
          console.error('Error status:', err.response?.status)
          console.error('Error data:', err.response?.data)
          
          if (err.response && err.response.data && err.response.data.message) {
            window.alert(`오류: ${err.response.data.message}`)
          } else if (err.message) {
            window.alert(`오류: ${err.message}`)
          } else {
            window.alert('피드백 등록 중 오류가 발생했습니다.')
          }
        })
    } else {
      console.log('Validation failed:', { secret, section, contents })
      window.alert('입력란을 채워주세요.')
    }
  }

  return (
    <div className="form">
      <div className="flex align_center" style={{ gap: '20px' }}>
        <div>
          <input
            type="radio"
            id="user_type"
            name="secret"
            value={true}
            onChange={(e) => {
              onChange(e)
              setIsAnonymousChecked(true)
            }}
            checked={isAnonymousChecked}
            className="ty02"
          />
          <label htmlFor="user_type">익명</label>
        </div>
        <div>
          <input
            type="radio"
            id="user_type2"
            name="secret"
            value={false}
            onChange={(e) => {
              onChange(e)
              setIsAnonymousChecked(false)
            }}
            checked={!isAnonymousChecked}
            className="ty02"
          />
          <label htmlFor="user_type2">일반</label>
        </div>
      </div>
      {/* <input
        type="text"
        name="title"
        value={title}
        placeholder="제목 입력"
        onChange={onChange}
        className="ty01 mt20"
      /> */}
      <input
        type="text"
        name="section"
        value={section}
        placeholder="구간 입력 (EX_ 05:30)"
        onChange={onChange}
        className="ty01 mt20"
      />
      <input
        type="text"
        name="contents"
        value={contents}
        placeholder="내용 입력"
        onChange={onChange}
        className="ty01 mt20"
      />
      <button onClick={SendFeedback} className="submit mt40">
        피드백 등록
      </button>
    </div>
  )
}

React.memo(FeedbackInput)
