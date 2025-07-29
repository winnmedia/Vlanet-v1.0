import React, { useState } from 'react';
import { UnifiedInput } from '../../components/unified/UnifiedInput';

import { StepWizard, WizardStep, useWizard } from './StepWizard';

export default {
  title: 'Minimal/StepWizard',
  component: StepWizard,
  parameters: {
    docs: {
      description: {
        component: '복잡한 다단계 프로세스를 단순하게 만드는 위자드 컴포넌트입니다.'
      }
    }
  }
};

// 기본 위자드
export const Default = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  return (
    <div style={{ width: '600px' }}>
      <StepWizard onComplete={(data) => {
        alert('위자드 완료!\n' + JSON.stringify(data, null, 2));
      }}>
        <WizardStep
          title="기본 정보"
          subtitle="이름과 이메일을 입력하세요">

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <UnifiedInput
              type="text"
              placeholder="이름"
              value={formData.name}
              onChange={(e) = aria-label="이름" /> setFormData((prev) => ({ ...prev, name: e.target.value }))}
              style={{
                padding: '12px',
                border: '1px solid #E5E5E7',
                borderRadius: '8px',
                fontSize: '16px'
              }} />

            <UnifiedInput
              type="email"
              placeholder="이메일"
              value={formData.email}
              onChange={(e) = aria-label="이메일" /> setFormData((prev) => ({ ...prev, email: e.target.value }))}
              style={{
                padding: '12px',
                border: '1px solid #E5E5E7',
                borderRadius: '8px',
                fontSize: '16px'
              }} />

          </div>
        </WizardStep>
        
        <WizardStep
          title="메시지 작성"
          subtitle="전달하고 싶은 메시지를 작성하세요">

          <textarea
            placeholder="메시지를 입력하세요..."
            value={formData.message}
            onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
            rows="6"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E5E5E7',
              borderRadius: '8px',
              fontSize: '16px',
              resize: 'vertical'
            }} />

        </WizardStep>
        
        <WizardStep
          title="확인"
          subtitle="입력한 정보를 확인하세요"
          showPrev={false}>

          <div style={{
            background: '#F5F5F7',
            padding: '24px',
            borderRadius: '12px',
            lineHeight: '1.6'
          }}>
            <p><strong>이름:</strong> {formData.name || '(미입력)'}</p>
            <p><strong>이메일:</strong> {formData.email || '(미입력)'}</p>
            <p><strong>메시지:</strong> {formData.message || '(미입력)'}</p>
          </div>
        </WizardStep>
      </StepWizard>
    </div>);

};

// 유효성 검사가 있는 위자드
export const WithValidation = () => {
  const [data, setData] = useState({ username: '', password: '', confirmPassword: '' });

  return (
    <div style={{ width: '600px' }}>
      <StepWizard>
        <WizardStep
          title="사용자명"
          subtitle="사용할 아이디를 입력하세요"
          isValid={data.username.length >= 3}
          onNext={() => {
            if (data.username.length < 3) {
              alert('사용자명은 3자 이상이어야 합니다');
              return false;
            }
            return true;
          }}>

          <UnifiedInput
            type="text"
            placeholder="최소 3자 이상"
            value={data.username}
            onChange={(e) = aria-label="최소 3자 이상" /> setData((prev) => ({ ...prev, username: e.target.value }))}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E5E5E7',
              borderRadius: '8px',
              fontSize: '16px'
            }} />

          {data.username && data.username.length < 3 &&
          <p style={{ color: '#FF3B30', fontSize: '14px', marginTop: '8px' }}>
              사용자명은 3자 이상이어야 합니다
            </p>
          }
        </WizardStep>
        
        <WizardStep
          title="비밀번호"
          subtitle="안전한 비밀번호를 설정하세요"
          isValid={data.password.length >= 8 && data.password === data.confirmPassword}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <UnifiedInput
              type="password"
              placeholder="비밀번호 (8자 이상)"
              value={data.password}
              onChange={(e) = aria-label="비밀번호 (8자 이상)" /> setData((prev) => ({ ...prev, password: e.target.value }))}
              style={{
                padding: '12px',
                border: '1px solid #E5E5E7',
                borderRadius: '8px',
                fontSize: '16px'
              }} />

            <UnifiedInput
              type="password"
              placeholder="비밀번호 확인"
              value={data.confirmPassword}
              onChange={(e) = aria-label="비밀번호 확인" /> setData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              style={{
                padding: '12px',
                border: '1px solid #E5E5E7',
                borderRadius: '8px',
                fontSize: '16px'
              }} />

            {data.password && data.confirmPassword && data.password !== data.confirmPassword &&
            <p style={{ color: '#FF3B30', fontSize: '14px' }}>
                비밀번호가 일치하지 않습니다
              </p>
            }
          </div>
        </WizardStep>
        
        <WizardStep title="완료" subtitle="계정이 생성되었습니다!">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h3>환영합니다, {data.username}님!</h3>
            <p>계정이 성공적으로 생성되었습니다.</p>
          </div>
        </WizardStep>
      </StepWizard>
    </div>);

};

// 커스텀 네비게이션
export const CustomNavigation = () => {
  const NavigationExample = () => {
    const { currentStep, totalSteps, goToStep } = useWizard();

    return (
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ color: '#8B8B8D', fontSize: '14px' }}>
          커스텀 네비게이션: 
          {Array.from({ length: totalSteps }, (_, i) =>
          <UnifiedButton key={i}
          onClick={() = aria-label="Click"> goToStep(i)} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> goToStep(i)}
          style={{
            margin: '0 4px',
            padding: '4px 8px',
            background: i === currentStep ? '#0066FF' : '#E5E5E7',
            color: i === currentStep ? 'white' : '#666',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}>

              Step {i + 1}
            </UnifiedButton>
          )}
        </p>
      </div>);

  };

  return (
    <div style={{ width: '600px' }}>
      <StepWizard>
        <WizardStep title="첫 번째 단계">
          <p>여러 단계를 자유롭게 이동할 수 있습니다.</p>
          <NavigationExample />
        </WizardStep>
        
        <WizardStep title="두 번째 단계">
          <p>이전에 완료한 단계로 돌아갈 수 있습니다.</p>
          <NavigationExample />
        </WizardStep>
        
        <WizardStep title="세 번째 단계">
          <p>진행 상황이 자동으로 저장됩니다.</p>
          <NavigationExample />
        </WizardStep>
      </StepWizard>
    </div>);

};

// 긴 프로세스 예시
export const LongProcess = () => {
  const steps = [
  { title: '프로젝트 정보', subtitle: '기본 정보를 입력하세요' },
  { title: '팀 구성', subtitle: '팀원을 추가하세요' },
  { title: '일정 설정', subtitle: '프로젝트 일정을 계획하세요' },
  { title: '예산 계획', subtitle: '예산을 배분하세요' },
  { title: '목표 설정', subtitle: 'KPI를 정의하세요' },
  { title: '리스크 관리', subtitle: '잠재적 위험을 식별하세요' },
  { title: '검토', subtitle: '모든 정보를 확인하세요' },
  { title: '완료', subtitle: '프로젝트가 생성되었습니다!' }];


  return (
    <div style={{ width: '700px' }}>
      <StepWizard>
        {steps.map((step, index) =>
        <WizardStep
          key={index}
          title={step.title}
          subtitle={step.subtitle}
          showPrev={index > 0}>

            <div style={{
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F5F5F7',
            borderRadius: '12px',
            fontSize: '18px',
            color: '#666'
          }}>
              {index < steps.length - 1 ?
            `Step ${index + 1} 내용이 여기에 표시됩니다` :

            <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                  <p>모든 단계가 완료되었습니다!</p>
                </div>
            }
            </div>
          </WizardStep>
        )}
      </StepWizard>
    </div>);

};
import { Button } from '../unified/Button';