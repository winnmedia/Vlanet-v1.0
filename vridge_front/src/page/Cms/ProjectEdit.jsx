
/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from '../../components/PageTemplate'
import dynamic from 'next/dynamic';;
import SideBar from '../../components/SideBar';
;
;
;
;
;
import { formatProcessDatesForBackend } from '../../utils/dateUtils';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from '../../util/nextNavigation';
import { produce } from 'immer';
import { useSelector, useDispatch } from 'react-redux';
import { project_initial, project_dateRange, refetchProject, checkSession } from '../../util/util';
import {
  GetProject,
  UpdateProjectAPI,
  FileDeleteAPI,
  DeleteProjectAPI } from
'../../api/project';

export default function ProjectEdit() {
  const { navigate } = useRouter();
  const dispatch = useDispatch();
  const { project_id } = useParams();
  const { project_list } = useSelector((s) => s.ProjectStore);
  const [current_project, set_current_project] = useState(null);

  const noAt = (value) => value.length < 50;
  const { inputs, onChange, set_inputs } = useInput(project_initial(), noAt);
  const { name, description, manager, consumer } = inputs;
  const [process, set_process] = useState(project_dateRange());
  const { files, FileChange, FileDelete } = useFile([]);
  const null_date = process.filter(
    (i, index) => i.startDate == null || i.endDate == null
  );

  // 인증 체크
  useEffect(() => {
    const session = checkSession();
    if (!session) {
      navigate('/Login', { replace: true });
    }
  }, []);

  useEffect(() => {
    GetProject(project_id).
    then((res) => {
      set_current_project(res.data.result);
      set_inputs(project_initial(res.data.result));
      set_process(project_dateRange(res.data.result));
    }).
    catch((err) => {
      if (err.response && err.response.data) {
        window.alert(err.response.data.message);
      }
    });
  }, []);

  // const ValidForm =
  //   name && description && manager && consumer && null_date.length === 0
  //     ? true
  //     : false
  const ValidForm = name && description && manager && consumer ? true : false;

  function UpdateBtn() {
    if (ValidForm) {
      const formData = new FormData();
      formData.append('inputs', JSON.stringify(inputs));

      // 날짜 포맷팅 적용
      const formattedProcess = formatProcessDatesForBackend(process);

      formData.append('process', JSON.stringify(formattedProcess));
      files.forEach((file, index) => {
        formData.append('files', file);
      });
      formData.append('members', JSON.stringify(current_project.member_list));
      UpdateProjectAPI(formData, project_id).
      then((res) => {
        refetchProject(dispatch, navigate);
        window.alert('업데이트 완료');
        navigate('/Calendar');
      }).
      catch((err) => {
        if (err.response && err.response.data) {
          window.alert(err.response.data.message);
        }
      });
    } else {
      window.alert('입력란을 채워주세요.');
    }
  }

  function DeleteBtn(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!project_id) {
      
      window.alert('프로젝트 ID를 찾을 수 없습니다.');
      return;
    }

    if (window.confirm('정말로 이 프로젝트를 삭제하시겠습니까?\n삭제된 프로젝트는 복구할 수 없습니다.')) {

      DeleteProjectAPI(project_id).
      then((res) => {

        window.alert('프로젝트가 삭제되었습니다.');
        navigate('/Calendar');

        // navigate 후에 refetchProject 실행
        setTimeout(() => {
          refetchProject(dispatch, navigate).catch((err) => {});
        }, 100);
      }).
      catch((err) => {
        
        if (err.response) {
          if (err.response.status === 401) {
            window.alert('인증이 만료되었습니다. 다시 로그인해주세요.');
            navigate('/Login', { replace: true });
          } else if (err.response.data && err.response.data.message) {
            window.alert(err.response.data.message);
          } else {
            window.alert('프로젝트 삭제 중 오류가 발생했습니다.');
          }
        } else {
          window.alert('서버에 연결할 수 없습니다.');
        }
      });
    } else {}
  }

  function filename(file) {
    return file.split('/').pop().split('\\').pop();
  }
  function download(file) {
    if (file) {
      const link = document.createElement('a');
      link.href = file;
      link.download = filename(file);
      link.target = '_self';
      link.click();
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
    let draft = { ...current_project };
    draft.member_list.forEach((i, index) => {
      if (i.id == id) {
        i.rating = e.target.value;
      }
    });

    set_current_project(draft);
  }

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar />
        {current_project &&
        <main className="project edit" role="main">
            <div className="title">프로젝트 등록</div>
            <div className="content">
              <div className="group grid responsive-grid">
                <ProjectInput inputs={inputs} onChange={onChange} />
              </div>
              <div className="group grid mt50 responsive-grid">
                <div className="part">
                  <div className="s_title">멤버 초대</div>
                  <InviteInput
                  project_id={project_id}
                  set_current_project={set_current_project}
                  pending_list={current_project.pending_list} />

                </div>
                <div className="part authority">
                  <div className="s_title">멤버 관리</div>
                  <ul>
                    {current_project.member_list.map((member, index) =>
                  <li
                    key={member.id}
                    className="flex align_center space_between">

                        {member.email}
                        <UnifiedInput variant="select" className="" onChange={(e) => ChangeRating(e, member.id)}
                      name="rating"
                      value={member.rating}>

                          <option value="manager">관리자</option>
                          <option value="normal">일반</option>
                        </UnifiedInput>
                      </li>
                  )}
                  </ul>
                </div>
              </div>
              <div className="group mt50">
                <div className="part day">
                  <div className="s_title">프로젝트 일정</div>
                  <ProcessDateEnhanced process={process} set_process={set_process} />
                </div>
              </div>
              <div className="group mt50">
                <div className="part file">
                  <div className="s_title">파일 등록</div>
                  <ul className="sample">
                    {current_project.files.map((item, index) =>
                      <li key={index} onClick={() => download(item.files)} onKeyDown={(e) => e.key === 'Enter' && download(item.files)}>
                        {filename(item.file_name)}
                        <UnifiedButton onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('삭제하시겠습니까?')) {
                        FileDeleteAPI(item.id).
                        then((res) => {
                          GetProject(project_id)
                          .then((res) => {
                            set_current_project(res.data.result);
                          })
                          .catch((err) => {
                            if (err.response && err.response.data) {
                              window.alert(err.response.data.message);
                            }
                          });
                        })
                        .catch((err) => {
                          if (err.response && err.response.data) {
                            window.alert(err.response.data.message);
                          }
                        });
                      }
                    }}>

                          삭제
                        </UnifiedButton>
                      </li>
                  )}
                    {files.map((file, index) =>
                  <li key={index}>
                        {file.name}
                        <UnifiedButton onClick={() => FileDelete(index)} onKeyDown={(e) => e.key === 'Enter' && FileDelete(index)}>삭제</UnifiedButton>
                      </li>
                  )}
                    <li className="upload_button">
                      <label htmlFor="file">
                        <div className="btn-upload">파일 업로드</div>
                      </label>
                      <UnifiedInput type="file"
                      name="file"
                      id="file"
                      onChange={FileChange} aria-label="file">
                    </UnifiedInput>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="btn_wrap">
                <UnifiedButton onClick={UpdateBtn} onKeyDown={(e) => e.key === 'Enter' && UpdateBtn} aria-label="Click">
                  등록
                </UnifiedButton>
                <UnifiedButton onClick={DeleteBtn} onKeyDown={(e) => e.key === 'Enter' && DeleteBtn} aria-label="Click">
                  삭제
                </UnifiedButton>
              </div>
            </div>
          </main>
        }
      </div>
    </PageTemplate>);

}

import { Button } from '../../components/unified/Button'
const ProcessDateEnhanced = dynamic(() => import('../../tasks/Project/ProcessDateEnhanced'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const useFile = dynamic(() => import('../../hooks/Usefile'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const useInput = dynamic(() => import('../../hooks/UseInput'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const ProjectInput = dynamic(() => import('../../tasks/Project/ProjectInput'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const InviteInput = dynamic(() => import('../../tasks/Project/InviteInput'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});;