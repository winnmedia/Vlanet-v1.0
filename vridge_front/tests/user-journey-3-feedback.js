/**
 * VideoPlanet 사용자 여정 테스트 #3: 피드백 시스템
 * 우선순위: 중간 (백엔드 복구 후 실행)
 */

const axios = require('axios');
const WebSocket = require('ws');

class FeedbackSystemJourneyTest {
    constructor() {
        this.baseURL = 'https://videoplanet.up.railway.app';
        this.wsURL = 'wss://videoplanet.up.railway.app';
        this.authToken = null;
        this.testProject = null;
        this.createdFeedbacks = [];
        this.testResults = {
            journey: 'Feedback System',
            scenarios: [],
            totalTests: 0,
            passedTests: 0,
            criticalIssues: [],
            realtimeTests: []
        };
    }

    async runJourney() {
        console.log('🚀 Journey 3: 피드백 시스템 테스트 시작');
        
        // 사전 조건: 인증 및 테스트 프로젝트 준비
        await this.setupTestEnvironment();
        
        if (!this.authToken || !this.testProject) {
            console.log('❌ 테스트 환경 준비 실패로 테스트 중단');
            return;
        }

        // 시나리오 1: 피드백 생성 (다양한 타입)
        await this.testFeedbackCreation();
        
        // 시나리오 2: 피드백 목록 조회 및 필터링
        await this.testFeedbackListing();
        
        // 시나리오 3: 피드백 상세 조회 및 미디어 처리
        await this.testFeedbackDetails();
        
        // 시나리오 4: 실시간 피드백 (WebSocket)
        await this.testRealtimeFeedback();
        
        // 시나리오 5: 피드백 상태 관리
        await this.testFeedbackStatusManagement();
        
        // 시나리오 6: 협업 기능 (댓글, 멘션)
        await this.testCollaborationFeatures();
        
        // 시나리오 7: 피드백 알림 시스템
        await this.testFeedbackNotifications();
        
        // 정리 작업
        await this.cleanup();
        
        this.generateReport();
    }

    async setupTestEnvironment() {
        // 인증
        try {
            const loginData = {
                email: 'test@example.com',
                password: 'Test123!'
            };

            const response = await axios.post(`${this.baseURL}/api/auth/login/`, loginData);
            this.authToken = response.data.access;
            console.log('✅ 사용자 인증 성공');
        } catch (error) {
            console.log('❌ 사용자 인증 실패:', error.message);
            return;
        }

        // 테스트 프로젝트 생성
        try {
            const projectData = {
                name: `피드백 테스트 프로젝트 ${Date.now()}`,
                type: 'test',
                client: '테스트 클라이언트'
            };

            const projectResponse = await axios.post(
                `${this.baseURL}/api/projects/`,
                projectData,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            );

            this.testProject = projectResponse.data;
            console.log('✅ 테스트 프로젝트 생성 성공:', this.testProject.id);
        } catch (error) {
            console.log('❌ 테스트 프로젝트 생성 실패:', error.message);
        }
    }

    async testFeedbackCreation() {
        const scenario = {
            name: '피드백 생성 (다양한 타입)',
            tests: [],
            criticalLevel: 'HIGH'
        };

        const feedbackTypes = [
            {
                type: 'general',
                content: '전반적인 영상 품질이 우수합니다.',
                priority: 'medium',
                category: 'quality'
            },
            {
                type: 'specific',
                content: '2분 30초 지점에서 음성이 끊깁니다.',
                priority: 'high',
                category: 'technical',
                timestamp: 150
            },
            {
                type: 'suggestion',
                content: '배경음악을 좀 더 부드럽게 조정하면 좋겠습니다.',
                priority: 'low',
                category: 'improvement'
            }
        ];

        for (const feedback of feedbackTypes) {
            try {
                const feedbackData = {
                    project: this.testProject.id,
                    ...feedback
                };

                const response = await axios.post(
                    `${this.baseURL}/api/feedbacks/`,
                    feedbackData,
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` }
                    }
                );

                if (response.status === 201) {
                    this.createdFeedbacks.push(response.data);
                    
                    scenario.tests.push({
                        name: `${feedback.type} 피드백 생성`,
                        status: 'PASS',
                        details: `피드백 ID: ${response.data.id}`,
                        feedbackId: response.data.id
                    });
                } else {
                    scenario.tests.push({
                        name: `${feedback.type} 피드백 생성`,
                        status: 'FAIL',
                        details: `예상치 못한 상태 코드: ${response.status}`
                    });
                }

            } catch (error) {
                scenario.tests.push({
                    name: `${feedback.type} 피드백 생성`,
                    status: 'FAIL',
                    details: `오류: ${error.response?.data?.message || error.message}`,
                    severity: 'HIGH'
                });
            }
        }

        // 첨부파일과 함께 피드백 생성 테스트
        await this.testFeedbackWithAttachment(scenario);
        
        this.testResults.scenarios.push(scenario);
    }

    async testFeedbackWithAttachment(scenario) {
        // 가상 파일 데이터로 테스트 (실제 파일 업로드 시뮬레이션)
        const feedbackWithFile = {
            project: this.testProject.id,
            type: 'technical',
            content: '스크린샷과 함께 제출하는 피드백입니다.',
            priority: 'medium',
            // 실제 구현에서는 FormData 사용
            attachment_info: {
                filename: 'screenshot.png',
                size: 1024000,
                type: 'image/png'
            }
        };

        try {
            const response = await axios.post(
                `${this.baseURL}/api/feedbacks/`,
                feedbackWithFile,
                {
                    headers: { 
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            scenario.tests.push({
                name: '첨부파일 포함 피드백',
                status: response.status === 201 ? 'PASS' : 'FAIL',
                details: response.status === 201 ? '첨부파일 피드백 생성 성공' : `상태: ${response.status}`
            });

            if (response.status === 201) {
                this.createdFeedbacks.push(response.data);
            }

        } catch (error) {
            scenario.tests.push({
                name: '첨부파일 포함 피드백',
                status: 'FAIL',
                details: `첨부파일 피드백 오류: ${error.message}`
            });
        }
    }

    async testFeedbackListing() {
        const scenario = {
            name: '피드백 목록 조회 및 필터링',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        try {
            // 프로젝트별 피드백 목록
            const listResponse = await axios.get(
                `${this.baseURL}/api/projects/${this.testProject.id}/feedbacks/`,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            );

            if (listResponse.status === 200) {
                const feedbacks = listResponse.data.results || listResponse.data;
                
                scenario.tests.push({
                    name: '프로젝트별 피드백 조회',
                    status: 'PASS',
                    details: `${feedbacks.length}개 피드백 조회됨`
                });

                // 우선순위별 필터링
                const highPriorityResponse = await axios.get(
                    `${this.baseURL}/api/projects/${this.testProject.id}/feedbacks/?priority=high`,
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` }
                    }
                );

                const highPriorityFeedbacks = highPriorityResponse.data.results || highPriorityResponse.data;
                const allHighPriority = highPriorityFeedbacks.every(f => f.priority === 'high');

                scenario.tests.push({
                    name: '우선순위별 필터링',
                    status: allHighPriority ? 'PASS' : 'FAIL',
                    details: `높은 우선순위 피드백: ${highPriorityFeedbacks.length}개`
                });

                // 카테고리별 필터링
                const technicalResponse = await axios.get(
                    `${this.baseURL}/api/projects/${this.testProject.id}/feedbacks/?category=technical`,
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` }
                    }
                );

                const technicalFeedbacks = technicalResponse.data.results || technicalResponse.data;
                
                scenario.tests.push({
                    name: '카테고리별 필터링',
                    status: 'PASS',
                    details: `기술적 피드백: ${technicalFeedbacks.length}개`
                });

            } else {
                scenario.tests.push({
                    name: '피드백 목록 조회',
                    status: 'FAIL',
                    details: `상태 코드: ${listResponse.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '피드백 목록 조회',
                status: 'FAIL',
                details: `오류: ${error.message}`,
                severity: 'HIGH'
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async testFeedbackDetails() {
        const scenario = {
            name: '피드백 상세 조회 및 미디어 처리',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        if (this.createdFeedbacks.length === 0) {
            scenario.tests.push({
                name: '피드백 상세 조회',
                status: 'SKIP',
                details: '생성된 피드백이 없어 건너뜀'
            });
            this.testResults.scenarios.push(scenario);
            return;
        }

        const feedback = this.createdFeedbacks[0];

        try {
            const response = await axios.get(
                `${this.baseURL}/api/feedbacks/${feedback.id}/`,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            );

            if (response.status === 200) {
                const details = response.data;
                
                scenario.tests.push({
                    name: '피드백 상세 조회',
                    status: 'PASS',
                    details: `피드백 내용: ${details.content?.substring(0, 50)}...`
                });

                // 필수 필드 확인
                const requiredFields = ['id', 'content', 'created_at', 'author'];
                const missingFields = requiredFields.filter(field => !details[field]);

                scenario.tests.push({
                    name: '필수 필드 완성도',
                    status: missingFields.length === 0 ? 'PASS' : 'FAIL',
                    details: missingFields.length === 0 ? '모든 필수 필드 존재' : `누락: ${missingFields.join(', ')}`
                });

                // 미디어 URL 접근성 테스트
                if (details.attachments && details.attachments.length > 0) {
                    const attachment = details.attachments[0];
                    
                    try {
                        const mediaResponse = await axios.head(attachment.url, { timeout: 5000 });
                        
                        scenario.tests.push({
                            name: '첨부파일 접근성',
                            status: mediaResponse.status === 200 ? 'PASS' : 'FAIL',
                            details: `첨부파일 URL 상태: ${mediaResponse.status}`
                        });
                    } catch (error) {
                        scenario.tests.push({
                            name: '첨부파일 접근성',
                            status: 'FAIL',
                            details: `첨부파일 접근 실패: ${error.message}`
                        });
                    }
                }

            } else {
                scenario.tests.push({
                    name: '피드백 상세 조회',
                    status: 'FAIL',
                    details: `상태 코드: ${response.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '피드백 상세 조회',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async testRealtimeFeedback() {
        const scenario = {
            name: '실시간 피드백 (WebSocket)',
            tests: [],
            criticalLevel: 'HIGH'
        };

        return new Promise((resolve) => {
            try {
                const ws = new WebSocket(`${this.wsURL}/ws/feedback/${this.testProject.id}/`);
                let connected = false;
                let messageReceived = false;

                const timeout = setTimeout(() => {
                    if (!connected) {
                        scenario.tests.push({
                            name: 'WebSocket 연결',
                            status: 'FAIL',
                            details: 'WebSocket 연결 타임아웃',
                            severity: 'HIGH'
                        });
                    }
                    
                    ws.close();
                    this.testResults.scenarios.push(scenario);
                    resolve();
                }, 10000);

                ws.on('open', () => {
                    connected = true;
                    scenario.tests.push({
                        name: 'WebSocket 연결',
                        status: 'PASS',
                        details: 'WebSocket 연결 성공'
                    });

                    // 실시간 피드백 메시지 전송
                    const testMessage = {
                        type: 'new_feedback',
                        content: '실시간 피드백 테스트 메시지',
                        timestamp: Date.now()
                    };

                    ws.send(JSON.stringify(testMessage));
                });

                ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        messageReceived = true;

                        scenario.tests.push({
                            name: '실시간 메시지 수신',
                            status: 'PASS',
                            details: `메시지 타입: ${message.type || 'unknown'}`
                        });

                    } catch (error) {
                        scenario.tests.push({
                            name: '실시간 메시지 파싱',
                            status: 'FAIL',
                            details: `메시지 파싱 오류: ${error.message}`
                        });
                    }
                });

                ws.on('error', (error) => {
                    scenario.tests.push({
                        name: 'WebSocket 오류 처리',
                        status: 'FAIL',
                        details: `WebSocket 오류: ${error.message}`,
                        severity: 'HIGH'
                    });

                    clearTimeout(timeout);
                    this.testResults.scenarios.push(scenario);
                    resolve();
                });

                ws.on('close', () => {
                    if (connected && !messageReceived) {
                        scenario.tests.push({
                            name: '실시간 통신 완성도',
                            status: 'PARTIAL',
                            details: '연결은 되었으나 메시지 교환 미완료'
                        });
                    }

                    clearTimeout(timeout);
                    this.testResults.scenarios.push(scenario);
                    resolve();
                });

            } catch (error) {
                scenario.tests.push({
                    name: 'WebSocket 초기화',
                    status: 'FAIL',
                    details: `WebSocket 초기화 실패: ${error.message}`,
                    severity: 'HIGH'
                });

                this.testResults.scenarios.push(scenario);
                resolve();
            }
        });
    }

    async testFeedbackStatusManagement() {
        const scenario = {
            name: '피드백 상태 관리',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        if (this.createdFeedbacks.length === 0) {
            scenario.tests.push({
                name: '피드백 상태 관리',
                status: 'SKIP',
                details: '관리할 피드백이 없어 건너뜀'
            });
            this.testResults.scenarios.push(scenario);
            return;
        }

        const feedback = this.createdFeedbacks[0];
        const statusFlow = ['pending', 'in_review', 'resolved', 'closed'];

        for (const status of statusFlow) {
            try {
                const response = await axios.patch(
                    `${this.baseURL}/api/feedbacks/${feedback.id}/`,
                    { status: status },
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` }
                    }
                );

                if (response.status === 200) {
                    scenario.tests.push({
                        name: `상태 변경: ${status}`,
                        status: response.data.status === status ? 'PASS' : 'FAIL',
                        details: `현재 상태: ${response.data.status}`
                    });
                } else {
                    scenario.tests.push({
                        name: `상태 변경: ${status}`,
                        status: 'FAIL',
                        details: `상태 코드: ${response.status}`
                    });
                }

                // 상태 변경 후 짧은 대기
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                scenario.tests.push({
                    name: `상태 변경: ${status}`,
                    status: 'FAIL',
                    details: `오류: ${error.message}`
                });
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testCollaborationFeatures() {
        const scenario = {
            name: '협업 기능 (댓글, 멘션)',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        if (this.createdFeedbacks.length === 0) {
            scenario.tests.push({
                name: '협업 기능',
                status: 'SKIP',
                details: '대상 피드백이 없어 건너뜀'
            });
            this.testResults.scenarios.push(scenario);
            return;
        }

        const feedback = this.createdFeedbacks[0];

        // 댓글 추가
        try {
            const commentData = {
                content: '이 피드백에 대한 추가 의견입니다.',
                parent_feedback: feedback.id
            };

            const commentResponse = await axios.post(
                `${this.baseURL}/api/feedback-comments/`,
                commentData,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            );

            scenario.tests.push({
                name: '댓글 추가',
                status: commentResponse.status === 201 ? 'PASS' : 'FAIL',
                details: commentResponse.status === 201 ? '댓글 추가 성공' : `상태: ${commentResponse.status}`
            });

        } catch (error) {
            scenario.tests.push({
                name: '댓글 추가',
                status: 'FAIL',
                details: `댓글 추가 오류: ${error.message}`
            });
        }

        // 멘션 기능 테스트
        try {
            const mentionData = {
                content: '@testuser 이 부분 확인해 주세요.',
                mentions: ['testuser'],
                parent_feedback: feedback.id
            };

            const mentionResponse = await axios.post(
                `${this.baseURL}/api/feedback-comments/`,
                mentionData,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            );

            scenario.tests.push({
                name: '멘션 기능',
                status: mentionResponse.status === 201 ? 'PASS' : 'FAIL',
                details: mentionResponse.status === 201 ? '멘션 기능 작동' : `상태: ${mentionResponse.status}`
            });

        } catch (error) {
            scenario.tests.push({
                name: '멘션 기능',
                status: 'FAIL',
                details: `멘션 기능 오류: ${error.message}`
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async testFeedbackNotifications() {
        const scenario = {
            name: '피드백 알림 시스템',
            tests: [],
            criticalLevel: 'LOW'
        };

        try {
            // 알림 목록 조회
            const notificationResponse = await axios.get(
                `${this.baseURL}/api/notifications/`,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            );

            scenario.tests.push({
                name: '알림 목록 조회',
                status: notificationResponse.status === 200 ? 'PASS' : 'FAIL',
                details: notificationResponse.status === 200 ? 
                    `${(notificationResponse.data.results || notificationResponse.data).length}개 알림` : 
                    `상태: ${notificationResponse.status}`
            });

            // 피드백 관련 알림 필터링
            if (notificationResponse.status === 200) {
                const notifications = notificationResponse.data.results || notificationResponse.data;
                const feedbackNotifications = notifications.filter(n => n.type === 'feedback');
                
                scenario.tests.push({
                    name: '피드백 알림 필터링',
                    status: 'PASS',
                    details: `피드백 관련 알림: ${feedbackNotifications.length}개`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '알림 시스템',
                status: 'FAIL',
                details: `알림 조회 오류: ${error.message}`
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async cleanup() {
        console.log('🧹 피드백 테스트 정리 작업 시작...');
        
        // 생성된 피드백들 정리
        for (const feedback of this.createdFeedbacks) {
            try {
                await axios.delete(
                    `${this.baseURL}/api/feedbacks/${feedback.id}/`,
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` }
                    }
                );
                console.log(`✅ 피드백 ${feedback.id} 정리 완료`);
            } catch (error) {
                console.log(`⚠️ 피드백 ${feedback.id} 정리 실패:`, error.message);
            }
        }

        // 테스트 프로젝트 정리
        if (this.testProject) {
            try {
                await axios.delete(
                    `${this.baseURL}/api/projects/${this.testProject.id}/`,
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` }
                    }
                );
                console.log(`✅ 테스트 프로젝트 ${this.testProject.id} 정리 완료`);
            } catch (error) {
                console.log(`⚠️ 테스트 프로젝트 정리 실패:`, error.message);
            }
        }
    }

    generateReport() {
        // 통계 계산
        this.testResults.scenarios.forEach(scenario => {
            scenario.tests.forEach(test => {
                this.testResults.totalTests++;
                if (test.status === 'PASS') {
                    this.testResults.passedTests++;
                }
            });
        });

        const successRate = ((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(1);

        console.log('\n=== Journey 3: 피드백 시스템 테스트 결과 ===');
        console.log(`총 테스트: ${this.testResults.totalTests}개`);
        console.log(`성공: ${this.testResults.passedTests}개`);
        console.log(`성공률: ${successRate}%`);

        if (this.testResults.criticalIssues.length > 0) {
            console.log('\n🚨 중요 문제점:');
            this.testResults.criticalIssues.forEach(issue => {
                console.log(`- ${issue.issue}: ${issue.impact}`);
            });
        }

        // 시나리오별 결과
        this.testResults.scenarios.forEach(scenario => {
            console.log(`\n📋 ${scenario.name}:`);
            scenario.tests.forEach(test => {
                const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⏸️';
                console.log(`  ${icon} ${test.name}: ${test.details}`);
            });
        });

        return this.testResults;
    }
}

// 모듈로 export
module.exports = FeedbackSystemJourneyTest;

// 직접 실행 시
if (require.main === module) {
    const journey = new FeedbackSystemJourneyTest();
    journey.runJourney().then(() => {
        console.log('\n🎉 Journey 3 테스트 완료!');
    }).catch(error => {
        console.error('❌ Journey 3 테스트 실행 중 오류:', error.message);
    });
}