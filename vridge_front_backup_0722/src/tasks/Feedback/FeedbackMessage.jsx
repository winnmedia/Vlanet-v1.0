import React, { useEffect, useState, useRef } from 'react'
import cx from 'classnames'

export default function FeedbackMessage({
  Rating,
  ws,
  socketConnected,
  items,
  me,
}) {
  //   const [sendMsg, setSendMsg] = useState(false)
  const recent_element = useRef()
  const { email, nickname, rating } = me

  const [text, set_text] = useState('')
  function SendMessage() {
    const valid_text = text.replaceAll(' ', '')
    if (socketConnected) {
      if (valid_text.length > 0) {
        ws.current.send(
          JSON.stringify({
            email: email,
            nickname: nickname,
            rating: rating,
            message: text,
          }),
        )
        set_text('')
      }
    } else {
      window.alert('채팅 서버가 불안정합니다. 재접속 해주세요.')
    }
  }

  function enterkey() {
    if (window.event.keyCode == 13) {
      SendMessage()
    }
  }

  useEffect(() => {
    if (recent_element.current) {
      recent_element.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      })
    }
  }, [items])

  // 소켓이 연결되었을 시에 send 메소드
  //   useEffect(() => {
  //     if (socketConnected) {
  //       ws.current.send(
  //         JSON.stringify({
  //           message: 'hi',
  //         }),
  //       )

  //       setSendMsg(true)
  //     }
  //   }, [socketConnected])

  //   useEffect(() => {
  //     if (sendMsg) {
  //       ws.current.onmessage = (evt) => {
  //         const data = JSON.parse(evt.data)
  //         console.log(data)
  //         setItems((prevItems) => [...prevItems, data])
  //       }
  //     }
  //   }, [sendMsg])

  return (
    socketConnected && (
      <>
        <div className="comment">
          <ul>
            {items.length > 0 ? (
              items.map((item, index) => (
                <li
                  key={index}
                  ref={index === items.length - 1 ? recent_element : null}
                >
                  <div className="flex align_center">
                    <div
                      className={
                        Rating(item.rating) == '관리자'
                          ? 'img_box admin'
                          : 'img_box basic'
                      }
                    ></div>
                    <div className="txt_box">
                      <span className="name">
                        {item.nickname}
                        <small
                          className={
                            Rating(item.rating) == '관리자' ? 'admin' : 'basic'
                          }
                        >
                          ({Rating(item.rating)})
                        </small>
                      </span>
                      <span className="email">{item.email}</span>
                    </div>
                  </div>
                  <div className="comment_box">{item.message}</div>
                </li>
              ))
            ) : (
              <li className="empty">
                웹페이지를 닫을 경우 대화 내용은 저장되지 않습니다.
              </li>
            )}
          </ul>
        </div>
        {me && (
          <div className="pr">
            <input
              type="text"
              value={text}
              onChange={(e) => set_text(e.target.value)}
              onKeyUp={enterkey}
              placeholder="채팅 입력"
              className="ty01"
              style={{ padding: '0 120px 0 15px' }}
            />
            <button onClick={SendMessage} className="cert">
              입력
            </button>
          </div>
        )}
      </>
    )
  )
}
React.memo(FeedbackMessage)
