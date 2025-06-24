import React from 'react'
import moment from 'moment'
import 'moment/locale/ko'

// import Swiper core and required modules
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules'

import { Swiper, SwiperSlide } from 'swiper/react'
// Import Swiper styles
import 'swiper/css'

export default function ProjectList({ project_list }) {
  const sort_basic_plan = project_list.sort((a, b) => {
    return new Date(a.basic_plan.end_date) - new Date(b.basic_plan.end_date)
  })
  const sort_story_board = project_list.sort((a, b) => {
    return new Date(a.story_board.end_date) - new Date(b.story_board.end_date)
  })
  const sort_filming = project_list.sort((a, b) => {
    return new Date(a.filming.end_date) - new Date(b.filming.end_date)
  })
  const sort_video_edit = project_list.sort((a, b) => {
    return new Date(a.video_edit.end_date) - new Date(b.video_edit.end_date)
  })
  const sort_post_work = project_list.sort((a, b) => {
    return new Date(a.post_work.end_date) - new Date(b.post_work.end_date)
  })
  const sort_video_preview = project_list.sort((a, b) => {
    return (
      new Date(a.video_preview.end_date) - new Date(b.video_preview.end_date)
    )
  })
  const sort_confirmation = project_list.sort((a, b) => {
    return new Date(a.confirmation.end_date) - new Date(b.confirmation.end_date)
  })
  const sort_video_delivery = project_list.sort((a, b) => {
    return (
      new Date(a.video_delivery.end_date) - new Date(b.video_delivery.end_date)
    )
  })
  return (
    <div className="list_box mt100">
      <div className="process flex space_between align_center">
        <div className="s_title">
          기초기획안 <br />
          작성
        </div>

        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          spaceBetween={0}
          slidesPerView={5}
          pagination={{ clickable: true }}
          scrollbar={{ draggable: true }}
          navigation
        >
          {sort_basic_plan.map(
            (project, index) =>
              !project.basic_plan.end_date ||
              (project.basic_plan.end_date &&
                new Date(project.basic_plan.end_date).setHours(0, 0, 0, 0) >=
                  new Date().setHours(0, 0, 0, 0) && (
                  <SwiperSlide key={index}>
                    <div className="inner03">
                      <div className="name">{project.name}</div>
                      {project.basic_plan.start_date &&
                      project.basic_plan.end_date ? (
                        <div className="day">
                          <span>
                            {moment(project.basic_plan.start_date).format(
                              'YYYY.MM.DD.dd',
                            )}{' '}
                          </span>
                          <span>
                            ~{' '}
                            {moment(project.basic_plan.end_date).format(
                              'YYYY.MM.DD.dd',
                            )}{' '}
                          </span>
                        </div>
                      ) : (
                        <span>날짜를 입력해주세요.</span>
                      )}
                    </div>
                  </SwiperSlide>
                )),
          )}
        </Swiper>
      </div>
      <div className="process flex space_between align_center">
        <div className="s_title">
          스토리보드 <br />
          작성
        </div>
        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          spaceBetween={0}
          slidesPerView={5}
          pagination={{ clickable: true }}
          scrollbar={{ draggable: true }}
          navigation
        >
          {sort_story_board.map(
            (project, index) =>
              !project.story_board.end_date ||
              (project.story_board.end_date &&
                new Date(project.story_board.end_date).setHours(0, 0, 0, 0) >=
                  new Date().setHours(0, 0, 0, 0) && (
                  <SwiperSlide key={index}>
                    <div className="inner03">
                      <div className="name">{project.name}</div>
                      {project.story_board.start_date &&
                      project.story_board.end_date ? (
                        <div className="day">
                          <span>
                            {moment(project.story_board.start_date).format(
                              'YYYY.MM.DD.dd',
                            )}{' '}
                          </span>
                          <span>
                            ~{' '}
                            {moment(project.story_board.end_date).format(
                              'YYYY.MM.DD.dd',
                            )}{' '}
                          </span>
                        </div>
                      ) : (
                        <span>날짜를 입력해주세요.</span>
                      )}
                    </div>
                  </SwiperSlide>
                )),
          )}
        </Swiper>
      </div>

      <div className="process flex space_between align_center">
        <div className="s_title">
          촬영 <br />
          (계획/진행)
        </div>
        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          spaceBetween={0}
          slidesPerView={5}
          pagination={{ clickable: true }}
          scrollbar={{ draggable: true }}
          navigation
        >
          {sort_filming.map(
            (project, index) =>
              !project.filming.end_date ||
              (project.filming.end_date &&
                new Date(project.filming.end_date).setHours(0, 0, 0, 0) >=
                  new Date().setHours(0, 0, 0, 0) && (
                  <SwiperSlide key={index}>
                    <div className="inner03">
                      <div className="name">{project.name}</div>
                      {project.filming.start_date &&
                      project.filming.end_date ? (
                        <div className="day">
                          <span>
                            {moment(project.filming.start_date).format(
                              'YYYY.MM.DD.dd',
                            )}{' '}
                          </span>
                          <span>
                            ~{' '}
                            {moment(project.filming.end_date).format(
                              'YYYY.MM.DD.dd',
                            )}{' '}
                          </span>
                        </div>
                      ) : (
                        <span>날짜를 입력해주세요.</span>
                      )}
                    </div>
                  </SwiperSlide>
                )),
          )}
        </Swiper>
      </div>
      <div className="process flex space_between align_center">
        <div className="s_title">비디오 편집</div>
        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          spaceBetween={0}
          slidesPerView={5}
          pagination={{ clickable: true }}
          scrollbar={{ draggable: true }}
          navigation
        >
          {sort_video_edit.map(
            (project, index) =>
              !project.video_edit.end_date ||
              (project.video_edit.end_date &&
                new Date(project.video_edit.end_date).setHours(0, 0, 0, 0) >=
                  new Date().setHours(0, 0, 0, 0) && (
                  <SwiperSlide key={index}>
                    <div className="inner03">
                      <div className="name">{project.name}</div>
                      {project.video_edit.start_date &&
                      project.video_edit.end_date ? (
                        <div className="day">
                          <span>
                            {moment(project.video_edit.start_date).format(
                              'YYYY.MM.DD.dd',
                            )}{' '}
                          </span>
                          <span>
                            ~{' '}
                            {moment(project.video_edit.end_date).format(
                              'YYYY.MM.DD.dd',
                            )}{' '}
                          </span>
                        </div>
                      ) : (
                        <span>날짜를 입력해주세요.</span>
                      )}
                    </div>
                  </SwiperSlide>
                )),
          )}
        </Swiper>
      </div>
      <div className="process flex space_between align_center">
        <div className="s_title">후반 작업</div>
        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          spaceBetween={0}
          slidesPerView={5}
          pagination={{ clickable: true }}
          scrollbar={{ draggable: true }}
          navigation
        >
          {sort_post_work.map(
            (project, index) =>
              !project.post_work.end_date ||
              (project.post_work.end_date &&
                new Date(project.post_work.end_date).setHours(0, 0, 0, 0) >=
                  new Date().setHours(0, 0, 0, 0) && (
                  <SwiperSlide key={index}>
                    <div className="inner03">
                      <div className="name">{project.name}</div>
                      {project.post_work.start_date &&
                      project.post_work.end_date ? (
                        <div className="day">
                          <span>
                            {moment(project.post_work.start_date).format(
                              'YYYY.MM.DD.dd',
                            )}{' '}
                          </span>
                          <span>
                            ~{' '}
                            {moment(project.post_work.end_date).format(
                              'YYYY.MM.DD.dd',
                            )}{' '}
                          </span>
                        </div>
                      ) : (
                        <span>날짜를 입력해주세요.</span>
                      )}
                    </div>
                  </SwiperSlide>
                )),
          )}
        </Swiper>
      </div>
      <div className="process flex space_between align_center">
        <div className="s_title">
          비디오 시사 <br />
          (피드백)
        </div>
        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          spaceBetween={0}
          slidesPerView={5}
          pagination={{ clickable: true }}
          scrollbar={{ draggable: true }}
          navigation
        >
          {sort_video_preview.map(
            (project, index) =>
              !project.video_preview.end_date ||
              (project.video_preview.end_date &&
                new Date(project.video_preview.end_date).setHours(0, 0, 0, 0) >=
                  new Date().setHours(0, 0, 0, 0) && (
                  <SwiperSlide key={index}>
                    <div className="inner03">
                      <div className="name">{project.name}</div>
                      {project.video_preview.start_date &&
                      project.video_preview.end_date ? (
                        <div className="day">
                          <span>
                            {moment(project.video_preview.start_date).format(
                              'YYYY.MM.DD.dd',
                            )}{' '}
                          </span>
                          <span>
                            ~{' '}
                            {moment(project.video_preview.end_date).format(
                              'YYYY.MM.DD.dd',
                            )}{' '}
                          </span>
                        </div>
                      ) : (
                        <span>날짜를 입력해주세요.</span>
                      )}
                    </div>
                  </SwiperSlide>
                )),
          )}
        </Swiper>
      </div>
      <div className="process flex space_between align_center">
        <div className="s_title">최종 컨펌</div>
        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          spaceBetween={0}
          slidesPerView={5}
          pagination={{ clickable: true }}
          scrollbar={{ draggable: true }}
          navigation
        >
          {sort_confirmation.map(
            (project, index) =>
              !project.confirmation.end_date ||
              (project.confirmation.end_date &&
                new Date(project.confirmation.end_date).setHours(0, 0, 0, 0) >=
                  new Date().setHours(0, 0, 0, 0) && (
                  <SwiperSlide key={index}>
                    <div className="inner03">
                      <div className="name">{project.name}</div>
                      {project.confirmation.start_date &&
                      project.confirmation.end_date ? (
                        <div className="day">
                          <span>
                            {moment(project.confirmation.start_date).format(
                              'YYYY.MM.DD.dd',
                            )}{' '}
                          </span>
                          <span>
                            ~{' '}
                            {moment(project.confirmation.end_date).format(
                              'YYYY.MM.DD.dd',
                            )}{' '}
                          </span>
                        </div>
                      ) : (
                        <span>날짜를 입력해주세요.</span>
                      )}
                    </div>
                  </SwiperSlide>
                )),
          )}
        </Swiper>
      </div>
      <div className="process flex space_between align_center">
        <div className="s_title">영상 납품</div>
        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          spaceBetween={0}
          slidesPerView={5}
          pagination={{ clickable: true }}
          scrollbar={{ draggable: true }}
          navigation
        >
          {sort_video_delivery.map(
            (project, index) =>
              !project.video_delivery.end_date ||
              (project.video_delivery.end_date &&
                new Date(project.video_delivery.end_date).setHours(
                  0,
                  0,
                  0,
                  0,
                ) >= new Date().setHours(0, 0, 0, 0) && (
                  <SwiperSlide key={index}>
                    <div className="inner03">
                      <div className="name">{project.name}</div>
                      {project.video_delivery.start_date &&
                      project.video_delivery.end_date ? (
                        <div className="day">
                          <span>
                            {moment(project.video_delivery.start_date).format(
                              'YYYY.MM.DD.dd',
                            )}{' '}
                          </span>
                          <span>
                            ~{' '}
                            {moment(project.video_delivery.end_date).format(
                              'YYYY.MM.DD.dd',
                            )}{' '}
                          </span>
                        </div>
                      ) : (
                        <span>날짜를 입력해주세요.</span>
                      )}
                    </div>
                  </SwiperSlide>
                )),
          )}
        </Swiper>
      </div>
    </div>
  )
}

React.memo(ProjectList)
