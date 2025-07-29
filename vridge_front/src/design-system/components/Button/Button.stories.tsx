import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import Button from './Button'
import FeedbackButton from './FeedbackButton'

export default {
  title: 'Design System/Button',
  component: Button,
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'danger', 'ghost', 'text'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
  },
} as ComponentMeta<typeof Button>

const Template: ComponentStory<typeof Button> = (args) => <Button {...args} />

export const Primary = Template.bind({})
Primary.args = {
  children: '기본 버튼',
  variant: 'primary',
}

export const Secondary = Template.bind({})
Secondary.args = {
  children: '보조 버튼',
  variant: 'secondary',
}

export const Danger = Template.bind({})
Danger.args = {
  children: '삭제',
  variant: 'danger',
}

export const Ghost = Template.bind({})
Ghost.args = {
  children: '고스트 버튼',
  variant: 'ghost',
}

export const Text = Template.bind({})
Text.args = {
  children: '텍스트 버튼',
  variant: 'text',
}

export const Small = Template.bind({})
Small.args = {
  children: '작은 버튼',
  size: 'sm',
}

export const Large = Template.bind({})
Large.args = {
  children: '큰 버튼',
  size: 'lg',
}

export const FullWidth = Template.bind({})
FullWidth.args = {
  children: '전체 너비 버튼',
  fullWidth: true,
}

export const Loading = Template.bind({})
Loading.args = {
  children: '로딩 중...',
  loading: true,
}

export const Disabled = Template.bind({})
Disabled.args = {
  children: '비활성화',
  disabled: true,
}

export const WithIcon = Template.bind({})
WithIcon.args = {
  children: (
    <>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
      </svg>
      아이콘 버튼
    </>
  ),
}

export const IconOnly = Template.bind({})
IconOnly.args = {
  children: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
    </svg>
  ),
  iconOnly: true,
}

// 피드백 버튼 스토리
export const FeedbackLike: ComponentStory<typeof FeedbackButton> = (args) => (
  <FeedbackButton {...args} />
)
FeedbackLike.args = {
  children: '좋아요',
  feedbackType: 'like',
}

export const FeedbackActive: ComponentStory<typeof FeedbackButton> = (args) => (
  <FeedbackButton {...args} />
)
FeedbackActive.args = {
  children: '좋아요',
  feedbackType: 'like',
  active: true,
}

// 버튼 그룹 예시
export const ButtonGroup = () => (
  <div style={{ display: 'flex', gap: '8px' }}>
    <Button variant="secondary" size="sm">취소</Button>
    <Button variant="primary" size="sm">확인</Button>
  </div>
)

// 피드백 액션 그룹 예시
export const FeedbackActions = () => (
  <div style={{ display: 'flex', gap: '8px' }}>
    <FeedbackButton feedbackType="like">좋아요</FeedbackButton>
    <FeedbackButton feedbackType="dislike">싫어요</FeedbackButton>
    <FeedbackButton feedbackType="reply">답글</FeedbackButton>
    <FeedbackButton feedbackType="needExplanation">추가 설명 필요</FeedbackButton>
    <FeedbackButton feedbackType="important">중요</FeedbackButton>
  </div>
)