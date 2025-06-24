import 'css/Cms/Cms.scss'
/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import ProjectInput from 'tasks/Project/ProjectInput'
import useInput from 'hooks/UseInput'
import useFile from 'hooks/Usefile'
import ProcessDate from 'tasks/Project/ProcessDate'

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateProjectAPI } from 'api/project'
import { refetchProject, project_initial, project_dateRange } from 'util/util'
import { useDispatch, useSelector } from 'react-redux'

export default function ProjectCreate() {
  const dispatch = useDispatch()
  const { sample_files } = useSelector((state) => state.ProjectStore)

  const navigate = useNavigate()
  const initial = project_initial()

  const initialDateRanges = project_dateRange()

  const noAt = (value) => value.length < 50
  const { inputs, onChange } = useInput(initial, noAt)
  const { name, description, manager, consumer } = inputs
  const [process, set_process] = useState(initialDateRanges)
  const null_date = process.filter(
    (i, index) => i.startDate == null || i.endDate == null,
  )
  const { files, FileChange, FileDelete } = useFile([])

  // const ValidForm =
  //   name && description && manager && consumer && null_date.length === 0
  //     ? true
  //     : false
  const ValidForm = name && description && manager && consumer ? true : false

  function CreateBtn() {
    if (ValidForm) {
      const formData = new FormData()
      formData.append('inputs', JSON.stringify(inputs))
      formData.append('process', JSON.stringify(process))
      files.forEach((file, index) => {
        formData.append('files', file)
      })

      CreateProjectAPI(formData)
        .then((res) => {
          refetchProject(dispatch, navigate)
          window.alert('프로젝트 생성 완료')
          navigate('/Calendar')
        })
        .catch((err) => {
          console.log(err)
          if (err.response && err.response.data) {
            window.alert(err.response.data.message)
          }
        })
    } else {
      window.alert('입력란을 채워주세요.')
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
  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar />
        <main className="project edit">
          <div className="title">프로젝트 등록</div>
          <div className="content">
            <div className="group grid">
              <ProjectInput inputs={inputs} onChange={onChange} />
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
                <ul className="upload">
                  <li>
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
                <ul className="sample">
                {files.map((file, index) => (
                  <li key={index}>
                    {file.name}
                    <button onClick={() => FileDelete(index)}>삭제</button>
                  </li>
                ))}
              </ul>
              </div>
            </div>

            <div className="btn_wrap">
              <button onClick={CreateBtn} className="submit">
                등록
              </button>
            </div>
          </div>
        </main>
      </div>
    </PageTemplate>
  )
}
