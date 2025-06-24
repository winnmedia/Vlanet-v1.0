import useInput from 'hooks/UseInput'
import React, { useState, useEffect } from 'react'

import { DeleteFeedback } from 'api/feedback'

export default function FeedbackManage({ refetch, current_project, user }) {
  function DropFeedback(feedback_id) {
    DeleteFeedback(feedback_id)
      .then((res) => {
        console.log(res)
        window.alert('피드백이 삭제되었습니다.')
        refetch()
      })
      .catch((err) => {
        if (err.response && err.response.data) {
          window.alert(err.response.data.message)
        }
      })
  }

  const My_Feedback = current_project.feedback.filter((i) => i.email == user)

  return (
    <div className="history">
      <ul>
        {My_Feedback.length > 0 ? (
          My_Feedback.map((feedback, index) => (
            <li key={index}>
              <div className="flex align_center space_between">
                <div className="txt_box">
                  <div className="time">{feedback.section}</div>
                  <p>{feedback.text}</p>
                </div>
                <button
                  onClick={() => DropFeedback(feedback.id)}
                  className="delete"
                >
                  삭제
                </button>
              </div>
            </li>
          ))
        ) : (
          <div className="flex mt50 justify_center">피드백이 없습니다.</div>
        )}
      </ul>
    </div>
  )
}

React.memo(FeedbackManage)
