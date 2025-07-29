import React, { useState, useEffect , Suspense } from 'react'
import dynamic from 'next/dynamic';;
import { useRouter, useLocation } from '../../util/nextNavigation';
import { useSelector } from 'react-redux';
import { GetFeedBack } from '../../api/feedback';
import { checkSession } from '../../util/util';

/* 상단 이미지 - 샘플, 기본 */
/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from '../../components/PageTemplate';
import SideBar from '../../components/SideBar';

import moment from 'moment';
import 'moment/locale/ko';

export default function FeedbackAll() {
  const router = useRouter();
  const { navigate } = router;
  const [feedback, setFeedback] = useState([]);
  const [reactions, setReactions] = useState({});
  const [projectData, setProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useSelector((s) => s.ProjectStore);

  // URL에서 projectId 가져오기
  const [projectId, setProjectId] = useState(null);

  useEffect(() => {
    if (router.isReady) {
      const id = router.query.projectId;

      setProjectId(id);
    }
  }, [router.isReady, router.query]);

  // 인증 체크
  useEffect(() => {
    const session = checkSession();
    if (!session) {
      navigate('/Login', { replace: true });
    }
  }, []);

  // 프로젝트 데이터 가져오기
  useEffect(() => {
    if (!projectId) {

      return;
    }

    setIsLoading(true);

    GetFeedBack(projectId).
    then((res) => {

      setProjectData(res.data.result);

      // 피드백 데이터 그룹화
      let groupedObjects = {};
      const feedback_data = res.data.result?.feedback || [];
      feedback_data.forEach((obj) => {
        const createdDate = moment(obj.created).format('YYYY.MM.DD.dd');
        if (groupedObjects.hasOwnProperty(createdDate)) {
          groupedObjects[createdDate].push(obj);
        } else {
          groupedObjects[createdDate] = [obj];
        }
      });
      setFeedback(Object.entries(groupedObjects));
      setIsLoading(false);
    }).
    catch((err) => {
      
      if (err.response?.status === 401) {
        window.alert('로그인이 필요합니다.');
        navigate('/Login');
      } else if (err.response?.status === 404) {
        window.alert('프로젝트를 찾을 수 없습니다.');
        navigate('/CmsHome');
      } else {
        window.alert('데이터를 불러오는 중 오류가 발생했습니다.');
      }
      setIsLoading(false);
    });
  }, [projectId]);

  function IsAdmin(project) {
    if (!project || !user) return false;

    if (
    user === project.owner_email ||
    project.member_list && Array.isArray(project.member_list) &&
    project.member_list.filter(
      (member, index) => member.email === user && member.rating === 'manager'
    ).length > 0)
    {
      return true;
    } else {
      return false;
    }
  }

  if (!projectId && router.isReady) {
    return (
      <PageTemplate>
        <div className="cms_wrap">
          <SideBar />
          <main role="main">
            <div className="content feedbackall">
              <div className="flex justify_center mt100">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '20px', color: '#dc3545', fontSize: '18px' }}>프로젝트를 찾을 수 없습니다</div>
                  <p style={{ marginBottom: '20px' }}>유효한 프로젝트 ID가 필요합니다.</p>
                  <UnifiedButton onClick={() = aria-label="Click"> navigate('/CmsHome')} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> navigate('/CmsHome')}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>

                    홈으로 돌아가기
                  </UnifiedButton>
                </div>
              </div>
            </div>
          </main>
        </div>
      </PageTemplate>);

  }

  if (isLoading || !router.isReady) {
    return (
      <PageTemplate>
        <div className="cms_wrap">
          <SideBar />
          <main role="main">
            <div className="content feedbackall">
              <div className="flex justify_center mt100">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '20px' }}>로딩 중...</div>
                  <p>피드백 데이터를 불러오는 중입니다.</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </PageTemplate>);

  }

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar />
        <main role="main">
          <div className="content feedbackall">
            <div className="title">
              <span
                onClick={() => navigate(`/Feedback/${projectId} onKeyDown={(e) => e.key === 'Enter' && () => navigate(`/Feedback/${projectId}`)}
                style={{ cursor: 'pointer', marginRight: '10px' }}>

                ← 뒤로가기
              </span>
              {projectData?.name ? `${projectData.name} - 전체 피드백` : '전체 피드백'}
            </div>
            <div className="list">
              {feedback.length > 0 ?
              feedback.map((item, index) =>
              <div className="part" key={index}>
                    <div className="day">
                      <span>{item[0]}</span>
                    </div>
                    <ul>
                      {item[1].map((data, i) =>
                  <li key={i}>
                          <div className="flex align_center">
                            <div
                        className={
                        data.email === projectData?.owner_email ||
                        projectData?.member_list?.find((m) => m.email === data.email && m.rating === 'manager') ?
                        'img_box admin' :
                        'img_box basic'
                        }>
                      </div>
                            <div className="txt_box">
                              {!data.security ?
                        <>
                                  <span className="name">
                                    {data.nickname}
                                    {data.email === projectData?.owner_email ?
                            <small className="admin">(관리자)</small> :

                            projectData?.member_list?.find((m) => m.email === data.email && m.rating === 'manager') ?
                            <small className="admin">(관리자)</small> :

                            <small className="basic">(일반)</small>

                            }
                                  </span>
                                  <span className="email">{data.email}</span>
                                </> :

                        <span className="name">익명</span>
                        }
                            </div>
                          </div>
                          <div className="flex align_center space_between mt20">
                            <div className="subject">{data.title}</div>
                            <span className="time">{data.section}</span>
                          </div>
                          <p>{data.text}</p>
                          
                          {/* 반응 카운트 표시 */}
                          {(data.like_count > 0 || data.dislike_count > 0) &&
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #e9ecef',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center'
                    }}>
                              {data.like_count > 0 &&
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '16px',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                                  <span>👍</span> {data.like_count}
                                </span>
                      }
                              {data.dislike_count > 0 &&
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '16px',
                        backgroundColor: '#ffebee',
                        color: '#d32f2f',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                                  <span>👎</span> {data.dislike_count}
                                </span>
                      }
                              {data.is_important &&
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '16px',
                        backgroundColor: '#fff3e0',
                        color: '#f57c00',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                                  <span>⭐</span> 중요
                                </span>
                      }
                            </div>
                    }
                          
                          {/* 답글 표시 */}
                          {data.replies && data.replies.length > 0 &&
                    <div style={{
                      marginTop: '16px',
                      paddingLeft: '20px',
                      borderLeft: '3px solid #e9ecef'
                    }}>
                              {data.replies.map((reply, replyIndex) =>
                      <div key={replyIndex} style={{
                        padding: '8px 0',
                        borderBottom: replyIndex < data.replies.length - 1 ? '1px solid #f5f5f5' : 'none'
                      }}>
                                  <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px'
                        }}>
                                    <span style={{
                            fontWeight: '600',
                            fontSize: '14px',
                            color: '#495057'
                          }}>
                                      {reply.nickname || '익명'}
                                    </span>
                                    <span style={{
                            fontSize: '12px',
                            color: '#6c757d'
                          }}>
                                      {moment(reply.created).fromNow()}
                                    </span>
                                  </div>
                                  <p style={{
                          margin: 0,
                          fontSize: '14px',
                          color: '#495057',
                          lineHeight: '1.5'
                        }}>
                                    {reply.text}
                                  </p>
                                </div>
                      )}
                            </div>
                    }
                        </li>
                  )}
                    </ul>
                  </div>
              ) :

              <div className="flex justify_center mt100">
                  피드백이 없습니다.
                </div>
              }
            </div>
          </div>
        </main>
      </div>
    </PageTemplate>);

}

import { Button } from '../../components/unified/Button';