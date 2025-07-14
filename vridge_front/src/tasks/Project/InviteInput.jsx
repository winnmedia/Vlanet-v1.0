import React, { useState, useEffect } from 'react'
import { GetProject } from 'api/project'
import { InviteProjectMember, CancelInvitation, GetProjectInvitations } from 'api/invitation'
import { axiosCredentials } from 'util/util'

export default function InviteInput({
  project_id,
  set_current_project,
  pending_list,
}) {
  const [emails, setEmails] = useState([''])
  const [duplicateEmails, setDuplicateEmails] = useState(new Set()) // 중복 초대된 이메일 추적
  const [recentInvitations, setRecentInvitations] = useState([]) // 최근 초대한 사람 목록
  const [showRecentInvitations, setShowRecentInvitations] = useState(false) // 최근 초대 목록 표시 여부

  // 최근 초대한 사람 목록 가져오기
  useEffect(() => {
    fetchRecentInvitations()
  }, [])

  const fetchRecentInvitations = async () => {
    try {
      const response = await axiosCredentials('get', '/api/users/recent-invitations/?limit=5')
      if (response.data && response.data.recent_invitations) {
        setRecentInvitations(response.data.recent_invitations)
      }
    } catch (err) {
      console.error('Failed to fetch recent invitations:', err)
    }
  }

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
    if (window.confirm('초대를 취소하시겠습니까?')) {
      CancelInvitation(project_id, id)
        .then((res) => {
          window.alert('초대가 취소되었습니다.')
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

  const handleResend = (email) => {
    if (window.confirm('초대를 다시 보내시겠습니까?')) {
      InviteProjectMember(project_id, { email: email, resend: true })
        .then((res) => {
          window.alert('초대 이메일을 재전송했습니다.')
          // 최근 초대 목록 갱신
          fetchRecentInvitations()
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
          <button 
            className="cert resend" 
            onClick={() => handleResend(pend.email)}
            style={{
              background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginLeft: '5px'
            }}
          >
            재전송
          </button>
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
              if (!email || !email.trim()) {
                window.alert('이메일을 입력해주세요.')
                return
              }
              
              // 중복 초대인 경우 재전송 여부 확인
              const resend = duplicateEmails.has(email)
              const requestData = resend ? { email: email, resend: true } : { email: email }
              
              InviteProjectMember(project_id, requestData)
                .then((res) => {
                  // 성공 시 중복 목록에서 제거
                  setDuplicateEmails(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(email)
                    return newSet
                  })
                  
                  InputChange(index, '')
                  window.alert(res.data.resent ? '초대 이메일을 재전송했습니다.' : '초대를 보냈습니다.')
                  
                  // 최근 초대 목록 갱신
                  fetchRecentInvitations()
                  
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
                  if (err.response) {
                    if (err.response.status === 409) {
                      // 409 Conflict: 이미 초대된 이메일
                      setDuplicateEmails(prev => new Set([...prev, email]))
                      if (window.confirm('이미 초대를 보낸 이메일입니다.\n초대를 다시 보내시겠습니까?')) {
                        // 재전송 요청
                        InviteProjectMember(project_id, { email: email, resend: true })
                          .then((res) => {
                            setDuplicateEmails(prev => {
                              const newSet = new Set(prev)
                              newSet.delete(email)
                              return newSet
                            })
                            InputChange(index, '')
                            window.alert('초대 이메일을 재전송했습니다.')
                            
                            // 최근 초대 목록 갱신
                            fetchRecentInvitations()
                            
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
                    } else if (err.response.data) {
                      window.alert(err.response.data.message)
                    }
                  }
                })
            }}
            className={duplicateEmails.has(email) ? "cert resend" : "cert"}
          >
            {duplicateEmails.has(email) ? '재전송' : '보내기'}
          </button>
          <button className="del" onClick={() => RemoveInput(index)}>
            삭제
          </button>
        </div>
      ))}
      <button className="add" onClick={AddInput}>
        멤버 추가
      </button>
      
      {/* 최근 초대한 멤버 리스트 */}
      {recentInvitations.length > 0 && (
        <div className="recent-invitations-section" style={{ marginTop: '20px' }}>
          <div 
            className="recent-invitations-header" 
            onClick={() => setShowRecentInvitations(!showRecentInvitations)}
            style={{
              cursor: 'pointer',
              padding: '10px',
              background: '#f5f5f5',
              borderRadius: '5px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ fontWeight: 'bold', color: '#333' }}>
              최근 초대한 멤버 ({recentInvitations.length})
            </span>
            <span style={{ fontSize: '12px' }}>
              {showRecentInvitations ? '▲' : '▼'}
            </span>
          </div>
          
          {showRecentInvitations && (
            <div className="recent-invitations-list" style={{ marginTop: '10px' }}>
              {recentInvitations.map((invitation) => (
                <div 
                  key={invitation.id} 
                  className="recent-invitation-item"
                  style={{
                    padding: '10px',
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '5px',
                    marginBottom: '5px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>{invitation.name}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{invitation.email}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      마지막 초대: {invitation.project_name} ({invitation.invitation_count}회)
                    </div>
                  </div>
                  <button
                    className="invite-again-btn"
                    onClick={() => {
                      const emptyIndex = emails.findIndex(email => !email.trim())
                      if (emptyIndex !== -1) {
                        InputChange(emptyIndex, invitation.email)
                      } else {
                        AddInput()
                        setTimeout(() => {
                          InputChange(emails.length, invitation.email)
                        }, 0)
                      }
                    }}
                    style={{
                      padding: '5px 15px',
                      background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    빠른 초대
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

React.memo(InviteInput)
