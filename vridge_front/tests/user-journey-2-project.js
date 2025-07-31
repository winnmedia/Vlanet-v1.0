/**
 * VideoPlanet 사용자 여정 테스트 #2: 프로젝트 생성 및 관리
 * 우선순위: 높음 (백엔드 복구 후 실행)
 */

const axios = require('axios');

class ProjectManagementJourneyTest {
    constructor() {
        this.baseURL = 'https://videoplanet.up.railway.app';
        this.authToken = null;
        this.createdProjects = [];
        this.testResults = {
            journey: 'Project Management',
            scenarios: [],
            totalTests: 0,
            passedTests: 0,
            criticalIssues: [],
            performanceMetrics: []
        };
    }

    async runJourney() {
        console.log('🚀 Journey 2: 프로젝트 생성 및 관리 테스트 시작');
        
        // 사전 조건: 인증 토큰 획득
        await this.authenticateUser();
        
        if (!this.authToken) {
            console.log('❌ 인증 실패로 테스트 중단');
            return;
        }

        // 시나리오 1: 프로젝트 생성 (다양한 타입)
        await this.testProjectCreation();
        
        // 시나리오 2: 프로젝트 목록 조회 및 필터링
        await this.testProjectListing();
        
        // 시나리오 3: 프로젝트 상세 정보 조회
        await this.testProjectDetails();
        
        // 시나리오 4: 프로젝트 수정
        await this.testProjectUpdate();
        
        // 시나리오 5: 중복 방지 시스템
        await this.testDuplicateProjectPrevention();
        
        // 시나리오 6: 동시성 테스트
        await this.testConcurrentAccess();
        
        // 시나리오 7: 프로젝트 삭제 및 복구
        await this.testProjectDeletion();
        
        // 정리 작업
        await this.cleanup();
        
        this.generateReport();
    }

    async authenticateUser() {
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
        }
    }

    async testProjectCreation() {
        const scenario = {
            name: '프로젝트 생성 (다양한 타입)',
            tests: [],
            criticalLevel: 'CRITICAL'
        };

        const projectTypes = [
            {
                name: '마케팅 영상 프로젝트',
                type: 'marketing',
                client: '테스트 클라이언트',
                budget: 5000000,
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
                name: '교육 컨텐츠 프로젝트',
                type: 'education',
                client: '교육 기관',
                budget: 3000000,
                deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
                name: '기업 홍보 영상',
                type: 'corporate',
                client: '기업 클라이언트',
                budget: 10000000,
                deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
        ];

        for (const project of projectTypes) {
            try {
                const startTime = Date.now();
                
                const response = await axios.post(
                    `${this.baseURL}/api/projects/`, 
                    project,
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` }
                    }
                );

                const responseTime = Date.now() - startTime;
                
                if (response.status === 201) {
                    this.createdProjects.push(response.data);
                    
                    scenario.tests.push({
                        name: `${project.type} 프로젝트 생성`,
                        status: 'PASS',
                        details: `프로젝트 ID: ${response.data.id}`,
                        performanceMs: responseTime
                    });

                    this.testResults.performanceMetrics.push({
                        operation: 'project_creation',
                        type: project.type,
                        responseTime: responseTime
                    });
                } else {
                    scenario.tests.push({
                        name: `${project.type} 프로젝트 생성`,
                        status: 'FAIL',
                        details: `예상치 못한 상태 코드: ${response.status}`
                    });
                }

            } catch (error) {
                scenario.tests.push({
                    name: `${project.type} 프로젝트 생성`,
                    status: 'FAIL',
                    details: `오류: ${error.response?.data?.message || error.message}`,
                    severity: 'HIGH'
                });

                if (error.response?.status === 400) {
                    // 필수 필드 검증 오류 분석
                    const validationErrors = error.response.data;
                    console.log(`📋 검증 오류 분석 (${project.type}):`, validationErrors);
                }
            }
        }

        // 입력 검증 테스트
        await this.testInputValidation(scenario);
        
        this.testResults.scenarios.push(scenario);
    }

    async testInputValidation(scenario) {
        // 잘못된 입력값 테스트
        const invalidInputs = [
            {
                name: '빈 프로젝트명',
                data: { name: '', type: 'marketing', client: '테스트' },
                expectedError: 'name required'
            },
            {
                name: '잘못된 예산',
                data: { name: '테스트 프로젝트', type: 'marketing', budget: -1000 },
                expectedError: 'invalid budget'
            },
            {
                name: '과거 마감일',
                data: { 
                    name: '테스트 프로젝트', 
                    type: 'marketing',
                    deadline: '2020-01-01'
                },
                expectedError: 'invalid deadline'
            }
        ];

        for (const invalidInput of invalidInputs) {
            try {
                const response = await axios.post(
                    `${this.baseURL}/api/projects/`,
                    invalidInput.data,
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` }
                    }
                );

                scenario.tests.push({
                    name: `입력 검증: ${invalidInput.name}`,
                    status: 'FAIL',
                    details: '잘못된 입력이 허용됨',
                    severity: 'MEDIUM'
                });

            } catch (error) {
                if (error.response && error.response.status === 400) {
                    scenario.tests.push({
                        name: `입력 검증: ${invalidInput.name}`,
                        status: 'PASS',
                        details: '잘못된 입력 적절히 차단됨'
                    });
                } else {
                    scenario.tests.push({
                        name: `입력 검증: ${invalidInput.name}`,
                        status: 'FAIL',
                        details: `예상치 못한 오류: ${error.message}`
                    });
                }
            }
        }
    }

    async testProjectListing() {
        const scenario = {
            name: '프로젝트 목록 조회 및 필터링',
            tests: [],
            criticalLevel: 'HIGH'
        };

        try {
            const startTime = Date.now();
            
            // 전체 프로젝트 목록 조회
            const listResponse = await axios.get(
                `${this.baseURL}/api/projects/`,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            );

            const responseTime = Date.now() - startTime;

            if (listResponse.status === 200) {
                const projects = listResponse.data.results || listResponse.data;
                
                scenario.tests.push({
                    name: '프로젝트 목록 조회',
                    status: 'PASS',
                    details: `${projects.length}개 프로젝트 조회됨`,
                    performanceMs: responseTime
                });

                // 페이지네이션 테스트
                if (projects.length > 10) {
                    const paginatedResponse = await axios.get(
                        `${this.baseURL}/api/projects/?page=1&limit=5`,
                        {
                            headers: { 'Authorization': `Bearer ${this.authToken}` }
                        }
                    );

                    scenario.tests.push({
                        name: '페이지네이션',
                        status: paginatedResponse.data.results.length <= 5 ? 'PASS' : 'FAIL',
                        details: `페이지네이션: ${paginatedResponse.data.results.length}개 항목 반환`
                    });
                }

                // 필터링 테스트 (타입별)
                const marketingFilter = await axios.get(
                    `${this.baseURL}/api/projects/?type=marketing`,
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` }
                    }
                );

                const marketingProjects = marketingFilter.data.results || marketingFilter.data;
                const allMarketing = marketingProjects.every(p => p.type === 'marketing');

                scenario.tests.push({
                    name: '타입별 필터링',
                    status: allMarketing ? 'PASS' : 'FAIL',
                    details: `마케팅 타입 필터: ${marketingProjects.length}개 프로젝트`
                });

            } else {
                scenario.tests.push({
                    name: '프로젝트 목록 조회',
                    status: 'FAIL',
                    details: `상태 코드: ${listResponse.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '프로젝트 목록 조회',
                status: 'FAIL',
                details: `오류: ${error.message}`,
                severity: 'HIGH'
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async testProjectDetails() {
        const scenario = {
            name: '프로젝트 상세 정보 조회',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        if (this.createdProjects.length === 0) {
            scenario.tests.push({
                name: '프로젝트 상세 조회',
                status: 'SKIP',
                details: '생성된 프로젝트가 없어 건너뜀'
            });
            this.testResults.scenarios.push(scenario);
            return;
        }

        const project = this.createdProjects[0];

        try {
            const response = await axios.get(
                `${this.baseURL}/api/projects/${project.id}/`,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            );

            if (response.status === 200) {
                const details = response.data;
                
                scenario.tests.push({
                    name: '프로젝트 상세 조회',
                    status: 'PASS',
                    details: `프로젝트명: ${details.name}, 상태: ${details.status || 'N/A'}`
                });

                // 필수 필드 존재 확인
                const requiredFields = ['id', 'name', 'type', 'created_at'];
                const missingFields = requiredFields.filter(field => !details[field]);

                scenario.tests.push({
                    name: '필수 필드 완성도',
                    status: missingFields.length === 0 ? 'PASS' : 'FAIL',
                    details: missingFields.length === 0 ? '모든 필수 필드 존재' : `누락 필드: ${missingFields.join(', ')}`
                });

            } else {
                scenario.tests.push({
                    name: '프로젝트 상세 조회',
                    status: 'FAIL',
                    details: `상태 코드: ${response.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '프로젝트 상세 조회',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }

        // 존재하지 않는 프로젝트 조회 테스트
        try {
            await axios.get(
                `${this.baseURL}/api/projects/99999/`,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            );

            scenario.tests.push({
                name: '존재하지 않는 프로젝트 처리',
                status: 'FAIL',
                details: '존재하지 않는 프로젝트가 조회됨'
            });

        } catch (error) {
            if (error.response && error.response.status === 404) {
                scenario.tests.push({
                    name: '존재하지 않는 프로젝트 처리',
                    status: 'PASS',
                    details: '404 오류 적절히 반환됨'
                });
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testProjectUpdate() {
        const scenario = {
            name: '프로젝트 수정',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        if (this.createdProjects.length === 0) {
            scenario.tests.push({
                name: '프로젝트 수정',
                status: 'SKIP',
                details: '수정할 프로젝트가 없어 건너뜀'
            });
            this.testResults.scenarios.push(scenario);
            return;
        }

        const project = this.createdProjects[0];
        const updateData = {
            name: `${project.name} (수정됨)`,
            budget: project.budget + 1000000,
            status: 'in_progress'
        };

        try {
            const response = await axios.patch(
                `${this.baseURL}/api/projects/${project.id}/`,
                updateData,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            );

            if (response.status === 200) {
                scenario.tests.push({
                    name: '프로젝트 부분 수정',
                    status: 'PASS',
                    details: `프로젝트명 변경: "${response.data.name}"`
                });

                // 변경사항 확인
                const verification = await axios.get(
                    `${this.baseURL}/api/projects/${project.id}/`,
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` }
                    }
                );

                const updated = verification.data;
                const nameUpdated = updated.name === updateData.name;
                const budgetUpdated = updated.budget === updateData.budget;

                scenario.tests.push({
                    name: '수정사항 반영 확인',
                    status: nameUpdated && budgetUpdated ? 'PASS' : 'FAIL',
                    details: `이름 반영: ${nameUpdated}, 예산 반영: ${budgetUpdated}`
                });

            } else {
                scenario.tests.push({
                    name: '프로젝트 수정',
                    status: 'FAIL',
                    details: `상태 코드: ${response.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '프로젝트 수정',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async testDuplicateProjectPrevention() {
        const scenario = {
            name: '중복 방지 시스템',
            tests: [],
            criticalLevel: 'HIGH'
        };

        if (this.createdProjects.length === 0) {
            scenario.tests.push({
                name: '중복 방지 테스트',
                status: 'SKIP',
                details: '기준 프로젝트가 없어 건너뜀'
            });
            this.testResults.scenarios.push(scenario);
            return;
        }

        const existingProject = this.createdProjects[0];
        const duplicateData = {
            name: existingProject.name,
            type: existingProject.type,
            client: existingProject.client
        };

        try {
            const response = await axios.post(
                `${this.baseURL}/api/projects/`,
                duplicateData,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            );

            scenario.tests.push({
                name: '동일 이름 프로젝트 생성 방지',
                status: 'FAIL',
                details: '중복 프로젝트 생성이 허용됨',
                severity: 'HIGH'
            });

        } catch (error) {
            if (error.response && error.response.status === 400) {
                scenario.tests.push({
                    name: '동일 이름 프로젝트 생성 방지',
                    status: 'PASS',
                    details: '중복 프로젝트 생성 적절히 차단됨'
                });
            } else {
                scenario.tests.push({
                    name: '동일 이름 프로젝트 생성 방지',
                    status: 'FAIL',
                    details: `예상치 못한 오류: ${error.message}`
                });
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testConcurrentAccess() {
        const scenario = {
            name: '동시성 테스트',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        if (this.createdProjects.length === 0) {
            scenario.tests.push({
                name: '동시성 테스트',
                status: 'SKIP',
                details: '테스트할 프로젝트가 없어 건너뜀'
            });
            this.testResults.scenarios.push(scenario);
            return;
        }

        const project = this.createdProjects[0];

        // 동시에 같은 프로젝트를 수정하는 요청 여러 개 발송
        const concurrentRequests = [];
        for (let i = 0; i < 5; i++) {
            const updateData = {
                name: `${project.name} - 동시수정${i}`,
                budget: project.budget + (i * 100000)
            };

            const request = axios.patch(
                `${this.baseURL}/api/projects/${project.id}/`,
                updateData,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            ).catch(error => ({ error: error.message }));

            concurrentRequests.push(request);
        }

        try {
            const results = await Promise.all(concurrentRequests);
            const successCount = results.filter(r => r.status === 200).length;
            const errorCount = results.filter(r => r.error).length;

            scenario.tests.push({
                name: '동시 수정 요청 처리',
                status: errorCount === 0 ? 'PASS' : 'PARTIAL',
                details: `성공: ${successCount}건, 오류: ${errorCount}건`
            });

        } catch (error) {
            scenario.tests.push({
                name: '동시 수정 요청 처리',
                status: 'FAIL',
                details: `동시성 테스트 실패: ${error.message}`
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async testProjectDeletion() {
        const scenario = {
            name: '프로젝트 삭제 및 복구',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        if (this.createdProjects.length === 0) {
            scenario.tests.push({
                name: '프로젝트 삭제',
                status: 'SKIP',
                details: '삭제할 프로젝트가 없어 건너뜀'
            });
            this.testResults.scenarios.push(scenario);
            return;
        }

        const projectToDelete = this.createdProjects[this.createdProjects.length - 1];

        try {
            const response = await axios.delete(
                `${this.baseURL}/api/projects/${projectToDelete.id}/`,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            );

            if (response.status === 204 || response.status === 200) {
                scenario.tests.push({
                    name: '프로젝트 삭제',
                    status: 'PASS',
                    details: `프로젝트 ID ${projectToDelete.id} 삭제 완료`
                });

                // 삭제 확인
                try {
                    await axios.get(
                        `${this.baseURL}/api/projects/${projectToDelete.id}/`,
                        {
                            headers: { 'Authorization': `Bearer ${this.authToken}` }
                        }
                    );

                    scenario.tests.push({
                        name: '삭제 확인',
                        status: 'FAIL',
                        details: '삭제된 프로젝트가 여전히 조회됨'
                    });

                } catch (error) {
                    if (error.response && error.response.status === 404) {
                        scenario.tests.push({
                            name: '삭제 확인',
                            status: 'PASS',
                            details: '삭제된 프로젝트 조회 시 404 반환'
                        });
                    }
                }

                // 배열에서 제거
                this.createdProjects = this.createdProjects.filter(p => p.id !== projectToDelete.id);

            } else {
                scenario.tests.push({
                    name: '프로젝트 삭제',
                    status: 'FAIL',
                    details: `삭제 실패: 상태 코드 ${response.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '프로젝트 삭제',
                status: 'FAIL',
                details: `삭제 오류: ${error.message}`
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async cleanup() {
        // 테스트 중 생성된 프로젝트들 정리
        console.log('🧹 테스트 정리 작업 시작...');
        
        for (const project of this.createdProjects) {
            try {
                await axios.delete(
                    `${this.baseURL}/api/projects/${project.id}/`,
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` }
                    }
                );
                console.log(`✅ 프로젝트 ${project.id} 정리 완료`);
            } catch (error) {
                console.log(`⚠️ 프로젝트 ${project.id} 정리 실패:`, error.message);
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

        console.log('\n=== Journey 2: 프로젝트 생성 및 관리 테스트 결과 ===');
        console.log(`총 테스트: ${this.testResults.totalTests}개`);
        console.log(`성공: ${this.testResults.passedTests}개`);
        console.log(`성공률: ${successRate}%`);

        // 성능 메트릭 요약
        if (this.testResults.performanceMetrics.length > 0) {
            const avgResponseTime = this.testResults.performanceMetrics
                .reduce((sum, metric) => sum + metric.responseTime, 0) / this.testResults.performanceMetrics.length;
            
            console.log(`평균 응답 시간: ${avgResponseTime.toFixed(0)}ms`);
        }

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
                const performance = test.performanceMs ? ` (${test.performanceMs}ms)` : '';
                console.log(`  ${icon} ${test.name}: ${test.details}${performance}`);
            });
        });

        return this.testResults;
    }
}

// 모듈로 export
module.exports = ProjectManagementJourneyTest;

// 직접 실행 시
if (require.main === module) {
    const journey = new ProjectManagementJourneyTest();
    journey.runJourney().then(() => {
        console.log('\n🎉 Journey 2 테스트 완료!');
    }).catch(error => {
        console.error('❌ Journey 2 테스트 실행 중 오류:', error.message);
    });
}