import 'css/Cms/Cms.scss'
/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import InviteInput from 'tasks/Project/InviteInput'
import ProjectInput from 'tasks/Project/ProjectInput'
import useInput from 'hooks/UseInput'
import useFile from 'hooks/Usefile'
import ProcessDate from 'tasks/Project/ProcessDate'

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { produce } from 'immer'
import { useSelector, useDispatch } from 'react-redux'
import { project_initial, project_dateRange, refetchProject } from 'util/util'
import {
  GetProject,
  UpdateProjectAPI,
  FileDeleteAPI,
  DeleteProjectAPI,
} from 'api/project'

export default function ProjectEdit() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { project_id } = useParams()
  const { project_list, sample_files } = useSelector((s) => s.ProjectStore)
  const [current_project, set_current_project] = useState(null)

  const noAt = (value) => value.length < 50
  const { inputs, onChange, set_inputs } = useInput(project_initial(), noAt)
  const { name, description, manager, consumer } = inputs
  const [process, set_process] = useState(project_dateRange())
  const { files, FileChange, FileDelete } = useFile([])
  const null_date = process.filter(
    (i, index) => i.startDate == null || i.endDate == null,
  )

  useEffect(() => {
    GetProject(project_id)
      .then((res) => {
        set_current_project(res.data.result)
        set_inputs(project_initial(res.data.result))
        set_process(project_dateRange(res.data.result))
      })
      .catch((err) => {
        if (err.response && err.response.data) {
          window.alert(err.response.data.message)
        }
      })
  }, [])

  // const ValidForm =
  //   name && description && manager && consumer && null_date.length === 0
  //     ? true
  //     : false
  const ValidForm = name && description && manager && consumer ? true : false

  function UpdateBtn() {
    if (ValidForm) {
      const formData = new FormData()
      formData.append('inputs', JSON.stringify(inputs))
      formData.append('process', JSON.stringify(process))
      files.forEach((file, index) => {
        formData.append('files', file)
      })
      formData.append('members', JSON.stringify(current_project.member_list))
      UpdateProjectAPI(formData, project_id)
        .then((res) => {
          refetchProject(dispatch, navigate)
          window.alert('업데이트 완료')
          navigate('/Calendar')
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

  function DeleteBtn() {
    if (window.confirm('삭제하시겠습니까?')) {
      DeleteProjectAPI(project_id)
        .then((res) => {
          refetchProject(dispatch, navigate)
          navigate('/Calendar')
        })
        .catch((err) => {
          if (err.response && err.response.data) {
            window.alert(err.response.data.message)
          }
        })
    }
  }

  function filename(file) {
    return file.split('/').pop().split('\\').pop()
  }
  function download(file) {
    if (file) {
      const link = document.createElement('a')
      link.href = file
      link.download = filename(file)
      link.target = '_self'
      link.click()
    }
  }

  function ChangeRating(e, id) {
    // const change_val = produce(current_project, (draft) => {
    //   draft = { ...current_project }
    //   draft.member_list.forEach((m, i) => {
    //     if (m.id == id) {
    //       m.rating = e.target.value
    //     }
    //   })
    //   return draft
    // })
    let draft = { ...current_project }
    draft.member_list.forEach((i, index) => {
      if (i.id == id) {
        i.rating = e.target.value
      }
    })

    set_current_project(draft)
  }

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar />
        {current_project && (
          <main className="project edit">
            <div className="title">프로젝트 등록</div>
            <div className="content">
              <div className="group grid">
                <ProjectInput inputs={inputs} onChange={onChange} />
              </div>
              <div className="group grid mt50">
                <div className="part">
                  <div className="s_title">멤버 초대</div>
                  <InviteInput
                    project_id={project_id}
                    set_current_project={set_current_project}
                    pending_list={current_project.pending_list}
                  />
                </div>
                <div className="part authority">
                  <div className="s_title">멤버 관리</div>
                  <ul>
                    {current_project.member_list.map((member, index) => (
                      <li
                        key={member.id}
                        className="flex align_center space_between"
                      >
                        {member.email}
                        <select
                          onChange={(e) => ChangeRating(e, member.id)}
                          name="rating"
                          value={member.rating}
                        >
                          <option value="manager">관리자</option>
                          <option value="normal">일반</option>
                        </select>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="group mt50">
                <div className="part day">
                  <div className="s_title">프로젝트 일정</div>
                  <ProcessDate process={process} set_process={set_process} />
                </div>
              </div>
              <div className="group grid mt50">
                <div className="part file">
                  <div className="s_title">문서 양식</div>
                  <ul className="sample">
                    <li>
                      {sample_files.map((file, index) => (
                        <span key={index} onClick={() => download(file.files)}>
                          {filename(file.file_name)}
                        </span>
                      ))}
                    </li>
                  </ul>
                </div>
                <div className="part file">
                  <div className="s_title">파일 등록</div>
                  <ul className="sample">
                    {current_project.files.map((item, index) => (
                      <li key={index} onClick={() => download(item.files)}>
                        {filename(item.file_name)}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm('삭제하시겠습니까?')) {
                              FileDeleteAPI(item.id)
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
                          }}
                        >
                          삭제
                        </button>
                      </li>
                    ))}
                    {files.map((file, index) => (
                      <li key={index}>
                        {file.name}
                        <button onClick={() => FileDelete(index)}>삭제</button>
                      </li>
                    ))}
                    <li className="upload_button">
                      <label htmlFor="file">
                        <div className="btn-upload">파일 업로드</div>
                      </label>
                      <input
                        type="file"
                        name="file"
                        id="file"
                        onChange={FileChange}
                      ></input>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="btn_wrap">
                <button onClick={UpdateBtn} className="submit">
                  등록
                </button>
                <button onClick={DeleteBtn} className="submit del">
                  삭제
                </button>
              </div>
            </div>
          </main>
        )}
      </div>
    </PageTemplate>
  )
}
