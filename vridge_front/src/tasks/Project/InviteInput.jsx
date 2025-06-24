import React, { useState, useEffect } from 'react'
import { GetProject, InviteProject, InviteCancel } from 'api/project'

export default function InviteInput({
  project_id,
  set_current_project,
  pending_list,
}) {
  const [emails, setEmails] = useState([''])

  const InputChange = (index, value) => {
    const newEmails = [...emails]
    newEmails[index] = value
    setEmails(newEmails)
  }

  const AddInput = () => {
    setEmails([...emails, ''])
  }

  const RemoveInput = (index) => {
    const newEmails = [...emails]
    newEmails.splice(index, 1)
    setEmails(newEmails)
  }

  const CancelBtn = (id) => {
    if (window.confirm('삭제하시겠습니까?')) {
      InviteCancel({ pk: id }, project_id)
        .then((res) => {
          GetProject(project_id)
            .then((res) => {
              set_current_project(res.data.result)
            })
            .catch((err) => {
              if (err.response && err.response.data) {
                window.alert(err.response.data.message)
              }
            })
        })
        .catch((err) => {
          if (err.response && err.response.data) {
            window.alert(err.response.data.message)
          }
        })
    }
  }

  return (
    <>
      {pending_list.map((pend, index) => (
        <div key={index} className="pr mt10">
          <input
            type="text"
            value={pend.email}
            className="ty01"
            placeholder="이메일 입력"
            readOnly
          />
          <button className="pend">초대됨</button>
          <button className="del" onClick={() => CancelBtn(pend.id)}>
            삭제
          </button>
        </div>
      ))}
      {emails.map((email, index) => (
        <div key={index} className="pr mt10">
          <input
            type="text"
            value={email}
            onChange={(e) => InputChange(index, e.target.value)}
            className="ty01"
            placeholder="이메일 입력"
          />
          <button
            onClick={() => {
              InputChange(index, '')
              InviteProject({ email: email }, project_id)
                .then((res) => {
                  GetProject(project_id)
                    .then((res) => {
                      set_current_project(res.data.result)
                    })
                    .catch((err) => {
                      if (err.response && err.response.data) {
                        window.alert(err.response.data.message)
                      }
                    })
                })
                .catch((err) => {
                  if (err.response && err.response.data) {
                    window.alert(err.response.data.message)
                  }
                })
            }}
            className="cert"
          >
            보내기
          </button>
          <button className="del" onClick={() => RemoveInput(index)}>
            삭제
          </button>
        </div>
      ))}
      <button className="add" onClick={AddInput}>
        멤버 추가
      </button>
    </>
  )
}

React.memo(InviteInput)
