import useInput from 'hooks/UseInput'
import React, { useState, useEffect } from 'react'

import { CreateFeedback } from 'api/feedback'

export default function FeedbackInput({ project_id, refetch }) {
  const initial = {
    secret: '',
    title: '',
    section: '',
    contents: '',
  }

  const { inputs, onChange, set_inputs } = useInput(initial)
  const { secret, section, contents } = inputs

  function SendFeedback() {
    if (secret && section && contents) {
      CreateFeedback(inputs, project_id)
        .then((res) => {
          window.alert('피드백 등록이 되었습니다.')
          set_inputs(initial)
          const secret = document.getElementsByName("secret")
          secret.forEach((checkbox) => {
            checkbox.checked = false
          })
          refetch()
        })
        .catch((err) => {
          if (err.response && err.response.data) {
            window.alert(err.response.data.message)
          }
        })
    } else {
      window.alert('입력란을 채워주세요.')
    }
  }

  return (
    <div className="form">
      <div className="flex align_center">
        <div>
          <input
            type="radio"
            id="user_type"
            name="secret"
            value={true}
            onChange={onChange}
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
            onChange={onChange}
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
