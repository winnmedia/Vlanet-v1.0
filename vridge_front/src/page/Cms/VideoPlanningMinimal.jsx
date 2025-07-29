import React, { useState, useEffect , Suspense } from 'react'
import dynamic from 'next/dynamic';;
;

import { UnifiedInput } from '../../components/unified/UnifiedInput';

import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { checkSession } from '../../util/util';
;
import moment from 'moment';
import 'moment/locale/ko';

import PageTemplate from '../../components/PageTemplate';
import SideBar from '../../components/SideBar';
import { StepWizard, WizardStep, useWizard } from '../../components/minimal/StepWizard';

import { CardHeader, CardContent, CardFooter } from '../../components/minimal/MinimalCard';
import { Input } from '../../components/unified/Input';
import styles from './VideoPlanningMinimal.module.scss'
const axios = dynamic(() => import('../../config/axios'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const UnifiedCard = dynamic(() => import('../../components/unified/UnifiedCard'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});;

// 스토리 프레임워크 정보
const STORY_FRAMEWORKS = {
  'hook_immersion': {
    name: '훅/몰입 구조',
    description: '강력한 도입부로 시청자를 사로잡는 구조',
    stages: ['훅', '몰입', '반전', '떡밥']
  },
  'classic': {
    name: '기승전결',
    description: '전통적인 4단계 구성',
    stages: ['기', '승', '전', '결']
  },
  'pixar': {
    name: '픽사 스토리텔링',
    description: '픽사 애니메이션의 검증된 구조',
    stages: ['옛날 옛적에', '매일매일', '어느 날', '그래서', '그래서', '마침내']
  },
  'save_the_cat': {
    name: 'Save the Cat',
    description: '헐리우드 각본 작법',
    stages: ['오프닝', '설정', '촉매', 'B스토리', '재미와 게임', '중간점', '악당 접근', '모두 잃음', '어둠의 영혼', '3막 전환', '피날레', '최종 이미지']
  },
  'star_moment': {
    name: '스타 모멘트',
    description: '클라이맥스를 중심으로 한 구조',
    stages: ['평범한 시작', '문제 발생', '위기 고조', '스타 모멘트', '해결과 여운']
  }
};

export default function VideoPlanningMinimal() {
  const router = useRouter();
  const { project } = useSelector((s) => s.ProjectStore);

  const [planningData, setPlanningData] = useState({
    project_id: project?.id || null,
    title: '',
    description: '',
    framework: 'hook_immersion',
    planning_text: '',
    stories: [],
    scenes: [],
    selectedStoryIndex: 0,
    selectedSceneIndex: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const session = checkSession();
    if (!session) {
      router.push('/Login');
    }
  }, [router]);

  const handleComplete = async (data) => {

    // 여기서 최종 저장 로직 구현
    router.push(`/Project/${project?.id}`);
  };

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar />
        
        <main className={styles.main} role="main">
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>영상 기획</h1>
              <p className={styles.subtitle}>
                {project?.name || '프로젝트 미선택'} • 
                {moment().format('YYYY년 MM월 DD일')}
              </p>
            </div>
          </div>

          <StepWizard
            onComplete={handleComplete}
            initialStep={0}>

            {/* Step 1: 기본 정보 입력 */}
            <WizardStep
              title="기획 정보"
              subtitle="영상의 기본 정보를 입력해주세요"
              onNext={() => {
                const { updateData } = useWizard();
                updateData({
                  title: planningData.title,
                  description: planningData.description
                });
              }}
              isValid={planningData.title.length > 0}>

              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>기획 제목</label>
                  <Input
                    type="text"
                    className={styles.input}
                    placeholder="예: 신제품 런칭 홍보 영상"
                    value={planningData.title}
                    onChange={(e) = aria-label="예: 신제품 런칭 홍보 영상"> setPlanningData((prev) => ({ ...prev, title: e.target.value }))} />

                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>기획 설명</label>
                  <UnifiedInput variant="textarea" className="" className={styles.textarea}
                    placeholder="영상의 목적과 주요 내용을 간단히 설명해주세요"
                    rows="4"
                    value={planningData.description}
                    onChange={(e) =/> setPlanningData((prev) => ({ ...prev, description: e.target.value }))} />

                </div>
              </div>
            </WizardStep>

            {/* Step 2: 스토리 프레임워크 선택 */}
            <WizardStep
              title="스토리 구조 선택"
              subtitle="영상에 적합한 스토리텔링 구조를 선택하세요"
              onNext={() => {
                const { updateData } = useWizard();
                updateData({ framework: planningData.framework });
              }}>

              <div className={styles.frameworkGrid}>
                {Object.entries(STORY_FRAMEWORKS).map(([key, framework]) =>
                <UnifiedCard key={key}
                  hoverable
                  clickable
                  onClick={() => setPlanningData((prev) => ({ ...prev, framework: key } onKeyDown={(e) => e.key === 'Enter' && () => setPlanningData((prev) => ({ ...prev, framework: key }))}
                  className={`${styles.frameworkCard} ${planningData.framework === key ? styles.selected : ''}`}>

                    <CardHeader
                    title={framework.name}
                    action={
                    planningData.framework === key &&
                    <div className={styles.selectedIcon}>✓</div>

                    } />

                    <CardContent>
                      <p className={styles.frameworkDesc}>{framework.description}</p>
                      <div className={styles.stages}>
                        {framework.stages.map((stage, idx) =>
                      <span key={idx} className={styles.stage}>{stage}</span>
                      )}
                      </div>
                    </CardContent>
                  </UnifiedCard>
                )}
              </div>
            </WizardStep>

            {/* Step 3: AI 기획 생성 */}
            <WizardStep
              title="AI 기획 생성"
              subtitle="영상의 핵심 내용을 입력하면 AI가 기획을 도와드립니다"
              onNext={async () => {
                setLoading(true);
                setError(null);

                try {
                  const token = checkSession();
                  const response = await axios.post(
                    '/api/video-planning/generate/planning/',
                    {
                      planning_text: planningData.planning_text,
                      planning_options: {
                        story_framework: planningData.framework,
                        project_id: planningData.project_id
                      }
                    },
                    {
                      headers: { 'Authorization': `Bearer ${token}` }
                    }
                  );

                  if (response.data.status === 'success') {
                    const { updateData } = useWizard();
                    const planning = response.data.data.planning;
                    setPlanningData((prev) => ({ ...prev, planning }));
                    updateData({ planning });
                    return true;
                  }
                } catch (err) {
                  setError(err.response?.data?.message || '기획 생성에 실패했습니다');
                  return false;
                } finally {
                  setLoading(false);
                }
              }}
              isValid={planningData.planning_text.length > 20}>

              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>영상 내용</label>
                  <UnifiedInput variant="textarea" className="" className={styles.textarea}
                    placeholder="영상으로 전달하고 싶은 핵심 메시지, 주요 포인트를 자유롭게 작성해주세요"
                    rows="8"
                    value={planningData.planning_text}
                    onChange={(e) =/> setPlanningData((prev) => ({ ...prev, planning_text: e.target.value }))} />

                  <div className={styles.charCount}>
                    {planningData.planning_text.length} / 최소 20자
                  </div>
                </div>
                
                {error &&
                <div className={styles.error}>{error}</div>
                }
                
                {loading &&
                <div className={styles.loadingState}>
                    <div className={styles.loadingSpinner} />
                    <p>AI가 기획을 생성하고 있습니다...</p>
                  </div>
                }
              </div>
            </WizardStep>

            {/* Step 4: 스토리 생성 */}
            <WizardStep
              title="스토리 구성"
              subtitle="AI가 생성한 스토리를 확인하고 수정하세요"
              onNext={async () => {
                setLoading(true);

                try {
                  const token = checkSession();
                  const response = await axios.post(
                    '/api/video-planning/generate/stories/',
                    {
                      planning_data: planningData.planning,
                      planning_options: {
                        story_framework: planningData.framework
                      }
                    },
                    {
                      headers: { 'Authorization': `Bearer ${token}` }
                    }
                  );

                  if (response.data.status === 'success') {
                    const stories = response.data.data.stories || [];
                    setPlanningData((prev) => ({ ...prev, stories }));
                    const { updateData } = useWizard();
                    updateData({ stories });
                    return true;
                  }
                } catch (err) {
                  setError(err.response?.data?.message || '스토리 생성에 실패했습니다');
                  return false;
                } finally {
                  setLoading(false);
                }
              }}>

              <div className={styles.storyContainer}>
                {planningData.stories.length > 0 ?
                <div className={styles.storyList}>
                    {planningData.stories.map((story, idx) =>
                  <UnifiedCard key={idx} className={styles.storyCard}>
                        <CardHeader
                      title={`${story.stage_name} - ${story.title}`}
                      subtitle={story.subtitle} />

                        <CardContent>
                          <p>{story.content}</p>
                        </CardContent>
                      </UnifiedCard>
                  )}
                  </div> :

                <div className={styles.emptyState}>
                    {loading ?
                  <>
                        <div className={styles.loadingSpinner} />
                        <p>스토리를 생성하고 있습니다...</p>
                      </> :

                  <p>이전 단계에서 기획을 생성해주세요</p>
                  }
                  </div>
                }
              </div>
            </WizardStep>

            {/* Step 5: 완료 및 저장 */}
            <WizardStep
              title="기획 완료"
              subtitle="기획이 완성되었습니다!"
              showPrev={false}>

              <div className={styles.completion}>
                <div className={styles.completionIcon}>
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="32" fill="#0066FF" opacity="0.1" />
                    <path d="M44 24L28 40L20 32" stroke="#0066FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                
                <h3 className={styles.completionTitle}>영상 기획이 완성되었습니다!</h3>
                <p className={styles.completionDesc}>
                  AI가 생성한 기획을 바탕으로 영상 제작을 시작하세요
                </p>
                
                <div className={styles.summary}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>기획 제목</span>
                    <span className={styles.summaryValue}>{planningData.title}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>스토리 구조</span>
                    <span className={styles.summaryValue}>
                      {STORY_FRAMEWORKS[planningData.framework]?.name}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>생성된 스토리</span>
                    <span className={styles.summaryValue}>{planningData.stories.length}개</span>
                  </div>
                </div>
              </div>
            </WizardStep>
          </StepWizard>
        </main>
      </div>
    </PageTemplate>);

}