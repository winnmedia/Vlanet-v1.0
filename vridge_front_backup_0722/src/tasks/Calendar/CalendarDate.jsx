import React, { useState } from 'react'
import { WriteMemo, DeleteMemo, UpdateDate } from 'api/project'
import { WriteUserMemo, DeleteUserMemo } from 'api/auth'
import { useParams } from 'react-router-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import moment from 'moment'
import 'moment/locale/ko'
import cx from 'classnames'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import 'tasks/Calendar/ModalStyle.scss'

import styled from 'styled-components'

import CalendarModal from './CalendarModal'

export function CalendarDate({
  index,
  week,
  month,
  year,
  type,
  day,
  current_project,
  project_list,
  user_memos,
  is_admin,
  refetch,
}) {
  const Day_Name = ['일', '월', '화', '수', '목', '금', '토']
  return (
    <>
      {index === 0 && (
        <div className="th">
          {type != '일' ? (
            <>
              {Day_Name.map((d, i) => (
                <div className={i === 0 || i === 6 ? 'holiday' : ''} key={i}>
                  {d}
                </div>
              ))}
            </>
          ) : (
            <div
              className={
                day.getDay() === 0 || day.getDay() === 6 ? 'holiday' : ''
              }
            >
              {Day_Name[day.getDay()]}
            </div>
          )}
        </div>
      )}
      {type === '월' && (
        <div key={index} className="td">
          <div className="week">
            {week.map((day, i) => (
              <Dates
                current_project={current_project}
                key={i}
                day={day}
                year={year}
                month={month}
                project_list={project_list}
                user_memos={user_memos}
                is_admin={is_admin}
                refetch={refetch}
              />
            ))}
          </div>
        </div>
      )}
      {type === '주' && (
        <div className="td">
          <div className="week">
            {week.map((day, index) => (
              <Dates
                current_project={current_project}
                key={index}
                day={day}
                year={year}
                month={month}
                project_list={project_list}
                user_memos={user_memos}
                is_admin={is_admin}
                refetch={refetch}
              />
            ))}
          </div>
        </div>
      )}
      {type === '일' && (
        <div className="td">
          <div className="week">
            <Dates
              current_project={current_project}
              day={day}
              month={month}
              year={year}
              project_list={project_list}
              user_memos={user_memos}
              is_admin={is_admin}
              refetch={refetch}
            />
          </div>
        </div>
      )}
    </>
  )
}

export function Dates({
  day,
  month,
  year,
  current_project,
  project_list,
  user_memos,
  is_admin,
  refetch,
}) {
  function date_info_style() {
    const holiday = day.getDay() == 0 || day.getDay() == 6
    const pre_or_next =
      day.getMonth() < month ||
      day.getFullYear() < year ||
      day.getMonth() > month ||
      day.getFullYear() > year
    const opacity = { opacity: pre_or_next ? '0.3' : '1' }
    const color = { color: holiday ? 'red' : '#000' }

    const style = { style: { ...opacity, ...color } }

    return style
  }

  function set_date(date) {
    return new Date(date).setHours(0, 0, 0, 0)
  }

  function class_valid(date) {
    if (date == day.setHours(0, 0, 0, 0)) {
      return true
    } else {
      return false
    }
  }

  const navigate = useNavigate()

  const [OnInputModal, setInputModal] = useState(false)

  const { project_id } = useParams()
  const date = new Date(day).getDate()

  const [memo, set_memo] = useState('')

  const input_modal = OnInputModal && (
    <CalendarModal
      visible={true}
      ModalTitle={<></>}
      ModalText={
        <div>
          <div className="day">
            {year}년 {month + 1}월 {date}일
          </div>
          <textarea
            className="mt20"
            name="textarea"
            placeholder="메모를 입력해주세요."
            cols="30"
            rows="10"
            value={memo}
            onChange={(e) => set_memo(e.target.value)}
          ></textarea>
          <div className="btn_wrap">
            <button
              className="submit"
              onClick={() => {
                if (memo.length > 0) {
                  if (is_admin) {
                    WriteMemo(
                      { date: `${year}-${month + 1}-${date}`, memo: memo },
                      project_id,
                    )
                      .then((res) => {
                        set_memo('')
                        refetch()
                        setInputModal(false)
                      })
                      .catch((err) => {
                        if (err.response && err.response.data) {
                          window.alert(err.response.data.message)
                        }
                      })
                  } else if (window.location.pathname.includes('/Calendar')) {
                    WriteUserMemo({
                      date: `${year}-${month + 1}-${date}`,
                      memo: memo,
                    })
                      .then((res) => {
                        set_memo('')
                        refetch()
                        setInputModal(false)
                      })
                      .catch((err) => {
                        if (err.response && err.response.data) {
                          window.alert(err.response.data.message)
                        }
                      })
                  }
                } else {
                  window.alert('메모를 작성해주세요.')
                }
              }}
            >
              등록
            </button>
            <button className="cancel" onClick={() => setInputModal(false)}>
              닫기
            </button>
          </div>
        </div>
      }
    />
  )

  const [DetailModal, setDetailModal] = useState(null)
  const detail_modal = DetailModal && (
    <CalendarModal
      ModalTitle={<></>}
      ModalText={
        <div>
          <div className="memo_txt">{DetailModal.memo}</div>

          <div className="btn_wrap">
            {(is_admin || window.location.pathname.includes('/Calendar')) && (
              <button
                className="submit"
                onClick={() => {
                  if (is_admin) {
                    DeleteMemo({ memo_id: DetailModal.id }, project_id)
                      .then((res) => {
                        refetch()
                        setDetailModal(null)
                      })
                      .catch((err) => {
                        if (err.response && err.response.data) {
                          window.alert(err.response.data.message)
                        }
                      })
                  } else if (window.location.pathname.includes('/Calendar')) {
                    DeleteUserMemo(DetailModal.id)
                      .then((res) => {
                        refetch()
                        setDetailModal(null)
                      })
                      .catch((err) => {
                        if (err.response && err.response.data) {
                          window.alert(err.response.data.message)
                        }
                      })
                  }
                }}
              >
                삭제
              </button>
            )}
            <button onClick={() => setDetailModal(null)} className="cancel">
              닫기
            </button>
          </div>
        </div>
      }
      visible={true}
    />
  )

  const [DateInput, SetDateInput] = useState(null)
  const filterPastDates = (date) => {
    const today = new Date()
    return date >= today || date.toDateString() === today.toDateString()
  }
  const update_modal = DateInput && (
    <CalendarModal
      ModalTitle={<></>}
      ModalText={
        <div>
          <div className="selec_wrap">
            <div className="select">
              <DatePicker
                placeholderText="시작 날짜"
                selected={
                  DateInput.start_date ? new Date(DateInput.start_date) : null
                }
                onChange={(date) =>
                  SetDateInput({
                    ...DateInput,
                    start_date: date,
                  })
                }
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={10}
                dateFormat="yyyy-MM-dd HH:mm"
                filterDate={filterPastDates} // 오늘 이전의 날짜 및 오늘 날짜 필터링
              />
            </div>
            <div className="select">
              <DatePicker
                placeholderText="종료 날짜"
                filterDate={(date) => {
                  const start_date = new Date(DateInput.start_date).setHours(
                    0,
                    0,
                    0,
                    0,
                  )
                  const currentDate = new Date(date)
                  return start_date <= currentDate && filterPastDates(date)
                }}
                filterTime={(time) =>
                  new Date(DateInput.start_date) < new Date(time)
                }
                selected={
                  DateInput.end_date ? new Date(DateInput.end_date) : null
                }
                onChange={(date) =>
                  SetDateInput({
                    ...DateInput,
                    end_date: date,
                  })
                }
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={10}
                dateFormat="yyyy-MM-dd HH:mm"
                disabled={!DateInput.start_date} // 시작 날짜가 선택되지 않은 경우에는 종료 날짜를 비활성화
              />
            </div>
          </div>

          <div className="btn_wrap">
            <button
              className="submit"
              onClick={() => {
                console.log(DateInput)
                if (
                  DateInput.start_date &&
                  DateInput.end_date &&
                  new Date(DateInput.start_date) < new Date(DateInput.end_date)
                ) {
                  UpdateDate(DateInput, project_id)
                    .then((res) => {
                      refetch()
                      SetDateInput(null)
                    })
                    .catch((err) => {
                      if (err.response && err.response.data) {
                        window.alert(err.response.data.message)
                      }
                    })
                } else {
                  window.alert('날짜를 입력해주세요.')
                }
              }}
            >
              변경하기
            </button>

            <button className="cancel" onClick={() => SetDateInput(null)}>
              닫기
            </button>
          </div>
        </div>
      }
      visible={true}
    />
  )

  const [on_modal, set_modal] = useState(null)
  const is_today =
    day.getMonth() == new Date().getMonth() &&
    day.getFullYear() == new Date().getFullYear() &&
    day.getDate() == new Date().getDate()

  const BarSpan = styled.span`
    &:hover::before {
      content: '${(props) => (props.content ? props.content : '')}';
      color: black;
      opacity: 0.3;
      font-size: 12px;
      position: absolute;
    }
  `
  return (
    <div {...date_info_style()} key={day}>
      {input_modal}
      {detail_modal}
      {update_modal}
      <p
        style={{
          cursor:
            is_admin || window.location.pathname.includes('/Calendar')
              ? 'pointer'
              : 'auto',
        }}
        onClick={() => {
          if (is_admin || window.location.pathname.includes('/Calendar')) {
            setInputModal(true)
          }
        }}
      >
        {is_today ? (
          <div className="today">{day.getDate()}</div>
        ) : (
          day.getDate()
        )}
      </p>
      {current_project && (
        <>
          {set_date(current_project.basic_plan.start_date) <= day &&
          day <= set_date(current_project.basic_plan.end_date) ? (
            <>
              <span
                onClick={() => {
                  if (is_admin) {
                    SetDateInput(current_project.basic_plan)
                  }
                }}
                onMouseOver={(e) => set_modal('기초기획안 작성')}
                onMouseLeave={(e) => set_modal(null)}
                style={{ cursor: is_admin ? 'pointer' : 'auto' }}
                className={cx('first', {
                  start: class_valid(
                    set_date(current_project.basic_plan.start_date),
                  ),
                  end: class_valid(
                    set_date(current_project.basic_plan.end_date),
                  ),
                })}
              />
              {on_modal == '기초기획안 작성' && (
                <div className="Modal">{on_modal}</div>
              )}
            </>
          ) : (
            <span></span>
          )}
          {set_date(current_project.story_board.start_date) <= day &&
          day <= set_date(current_project.story_board.end_date) ? (
            <>
              <span
                onClick={() => {
                  if (is_admin) {
                    SetDateInput(current_project.story_board)
                  }
                }}
                onMouseOver={(e) => set_modal('스토리보드 작성')}
                onMouseLeave={(e) => set_modal(null)}
                style={{ cursor: is_admin ? 'pointer' : 'auto' }}
                className={cx('second', {
                  start: class_valid(
                    set_date(current_project.story_board.start_date),
                  ),
                  end: class_valid(
                    set_date(current_project.story_board.end_date),
                  ),
                })}
              />
              {on_modal == '스토리보드 작성' && (
                <div className="Modal">{on_modal}</div>
              )}
            </>
          ) : (
            <span></span>
          )}
          {set_date(current_project.filming.start_date) <= day &&
          day <= set_date(current_project.filming.end_date) ? (
            <>
              <span
                onClick={() => {
                  if (is_admin) {
                    SetDateInput(current_project.filming)
                  }
                }}
                onMouseOver={(e) => set_modal('촬영(계획/진행)')}
                onMouseLeave={(e) => set_modal(null)}
                style={{ cursor: is_admin ? 'pointer' : 'auto' }}
                className={cx('third', {
                  start: class_valid(
                    set_date(current_project.filming.start_date),
                  ),
                  end: class_valid(set_date(current_project.filming.end_date)),
                })}
              />
              {on_modal == '촬영(계획/진행)' && (
                <div className="Modal">{on_modal}</div>
              )}
            </>
          ) : (
            <span></span>
          )}
          {set_date(current_project.video_edit.start_date) <= day &&
          day <= set_date(current_project.video_edit.end_date) ? (
            <>
              <span
                onClick={() => {
                  if (is_admin) {
                    SetDateInput(current_project.video_edit)
                  }
                }}
                onMouseOver={(e) => set_modal('비디오 편집')}
                onMouseLeave={(e) => set_modal(null)}
                style={{ cursor: is_admin ? 'pointer' : 'auto' }}
                className={cx('fourth', {
                  start: class_valid(
                    set_date(current_project.video_edit.start_date),
                  ),
                  end: class_valid(
                    set_date(current_project.video_edit.end_date),
                  ),
                })}
              />
              {on_modal == '비디오 편집' && (
                <div className="Modal">{on_modal}</div>
              )}
            </>
          ) : (
            <span></span>
          )}
          {set_date(current_project.post_work.start_date) <= day &&
          day <= set_date(current_project.post_work.end_date) ? (
            <>
              <span
                onClick={() => {
                  if (is_admin) {
                    SetDateInput(current_project.post_work)
                  }
                }}
                onMouseOver={(e) => set_modal('후반 작업')}
                onMouseLeave={(e) => set_modal(null)}
                style={{ cursor: is_admin ? 'pointer' : 'auto' }}
                className={cx('fifth', {
                  start: class_valid(
                    set_date(current_project.post_work.start_date),
                  ),
                  end: class_valid(
                    set_date(current_project.post_work.end_date),
                  ),
                })}
              />
              {on_modal == '후반 작업' && (
                <div className="Modal">{on_modal}</div>
              )}
            </>
          ) : (
            <span></span>
          )}
          {set_date(current_project.video_preview.start_date) <= day &&
          day <= set_date(current_project.video_preview.end_date) ? (
            <>
              <span
                onClick={() => {
                  if (is_admin) {
                    SetDateInput(current_project.video_preview)
                  }
                }}
                onMouseOver={(e) => set_modal('비디오 시사')}
                onMouseLeave={(e) => set_modal(null)}
                style={{ cursor: is_admin ? 'pointer' : 'auto' }}
                className={cx('sixth', {
                  start: class_valid(
                    set_date(current_project.video_preview.start_date),
                  ),
                  end: class_valid(
                    set_date(current_project.video_preview.end_date),
                  ),
                })}
              />
              {on_modal == '비디오 시사' && (
                <div className="Modal">{on_modal}</div>
              )}
            </>
          ) : (
            <span></span>
          )}
          {set_date(current_project.confirmation.start_date) <= day &&
          day <= set_date(current_project.confirmation.end_date) ? (
            <>
              <span
                onClick={() => {
                  if (is_admin) {
                    SetDateInput(current_project.confirmation)
                  }
                }}
                onMouseOver={(e) => set_modal('최종 컨펌')}
                onMouseLeave={(e) => set_modal(null)}
                style={{ cursor: is_admin ? 'pointer' : 'auto' }}
                className={cx('seven', {
                  start: class_valid(
                    set_date(current_project.confirmation.start_date),
                  ),
                  end: class_valid(
                    set_date(current_project.confirmation.end_date),
                  ),
                })}
              />
              {on_modal == '최종 컨펌' && (
                <div className="Modal">{on_modal}</div>
              )}
            </>
          ) : (
            <span></span>
          )}
          {set_date(current_project.video_delivery.start_date) <= day &&
          day <= set_date(current_project.video_delivery.end_date) ? (
            <>
              <span
                onClick={() => {
                  if (is_admin) {
                    SetDateInput(current_project.video_delivery)
                  }
                }}
                onMouseOver={(e) => set_modal('영상 납품')}
                onMouseLeave={(e) => set_modal(null)}
                style={{ cursor: is_admin ? 'pointer' : 'auto' }}
                className={cx('eighth', {
                  start: class_valid(
                    set_date(current_project.video_delivery.start_date),
                  ),
                  end: class_valid(
                    set_date(current_project.video_delivery.end_date),
                  ),
                })}
              />
              {on_modal == '영상 납품' && (
                <div className="Modal">{on_modal}</div>
              )}
            </>
          ) : (
            <span></span>
          )}
          {current_project.memo.map((memo, index) => {
            if (set_date(memo.date) == set_date(day)) {
              return (
                <span
                  className="memo"
                  onClick={() => setDetailModal(memo)}
                  style={{ color: '#23262d', cursor: 'pointer' }}
                  key={index}
                >
                  {memo.memo}
                </span>
              )
            }
          })}
        </>
      )}
      {project_list &&
        project_list.map((project, index) =>
          set_date(project.first_date) <= day &&
          day <= set_date(project.end_date) ? (
            <>
              <span
                onMouseOver={(e) => set_modal(index)}
                onMouseLeave={(e) => set_modal(null)}
                onClick={() => navigate(`/ProjectView/${project.id}`)}
                className={cx({
                  start: class_valid(set_date(project.first_date)),
                  end: class_valid(set_date(project.end_date)),
                })}
                key={index}
                style={{ background: project.color, cursor: 'pointer' }}
              ></span>
              {on_modal == index && <div className="Modal">{project.name}</div>}
            </>
          ) : (
            <span key={index}></span>
          ),
        )}
      {user_memos &&
        user_memos.map((memo, index) => {
          if (set_date(memo.date) == set_date(day)) {
            return (
              <span
                className="memo"
                onClick={() => setDetailModal(memo)}
                style={{ color: '#23262d', cursor: 'pointer' }}
                key={index}
              >
                {memo.memo}
              </span>
            )
          }
        })}
    </div>
  )
}
