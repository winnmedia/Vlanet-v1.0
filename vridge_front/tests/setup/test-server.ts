/**
 * 테스트 서버 설정
 * 실제 API 없이 테스트할 수 있도록 모의 응답 설정
 */

import { test as base } from '@playwright/test';

export const test = base.extend({
  // API 모킹을 위한 fixture
  mockAPI: async ({ page }, use) => {
    // 로그인 API 모킹
    await page.route('**/api/users/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          user: {
            id: 1,
            email: 'test@example.com',
            name: '테스트 사용자'
          }
        })
      });
    });

    // 프로젝트 목록 API 모킹
    await page.route('**/api/projects', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          project_list: [
            {
              id: 1,
              name: '테스트 프로젝트 1',
              description: '프로젝트 설명',
              status: 'active',
              updated: '2025-01-28T10:00:00Z',
              current_phase: '기획',
              members: [
                { id: 1, name: '김철수', role: 'manager' },
                { id: 2, name: '이영희', role: 'member' }
              ]
            },
            {
              id: 2,
              name: '테스트 프로젝트 2',
              description: '두 번째 프로젝트',
              status: 'delayed',
              updated: '2025-01-27T15:30:00Z',
              current_phase: '제작',
              members: [
                { id: 1, name: '김철수', role: 'member' }
              ]
            }
          ]
        })
      });
    });

    // 피드백 API 모킹
    await page.route('**/api/feedbacks/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          project: {
            id: 1,
            name: '테스트 프로젝트',
            video_url: '/sample-video.mp4'
          },
          feedbacks: [
            {
              id: 1,
              message: '좋은 피드백입니다',
              nickname: '익명',
              created: '2025-01-28T09:00:00Z',
              like_count: 5,
              dislike_count: 1
            }
          ]
        })
      });
    });

    await use(page);
  }
});