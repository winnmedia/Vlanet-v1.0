/**
 * VideoPlanet 사용자 여정 테스트 #5: 관리자 기능
 * 우선순위: 낮음 (관리자 전용 기능)
 */

const axios = require('axios');

class AdminFunctionsJourneyTest {
    constructor() {
        this.baseURL = 'https://videoplanet.up.railway.app';
        this.authToken = null;
        this.adminToken = null;
        this.testUsers = [];
        this.testProjects = [];
        this.testResults = {
            journey: 'Admin Functions',
            scenarios: [],
            totalTests: 0,
            passedTests: 0,
            criticalIssues: [],
            securityTests: []
        };
    }

    async runJourney() {
        console.log('🚀 Journey 5: 관리자 기능 테스트 시작');
        
        // 사전 조건: 관리자 인증
        await this.setupAdminEnvironment();
        
        if (!this.adminToken) {
            console.log('❌ 관리자 인증 실패로 테스트 중단');
            return;
        }

        // 시나리오 1: 사용자 관리 (생성, 수정, 삭제, 권한)
        await this.testUserManagement();
        
        // 시나리오 2: 프로젝트 관리 및 모니터링
        await this.testProjectManagement();
        
        // 시나리오 3: 시스템 통계 및 분석
        await this.testSystemAnalytics();
        
        // 시나리오 4: 권한 및 보안 관리
        await this.testSecurityManagement();
        
        // 시나리오 5: 초대 시스템 관리
        await this.testInvitationManagement();
        
        // 시나리오 6: 시스템 설정 및 구성
        await this.testSystemConfiguration();
        
        // 시나리오 7: 감사 로그 및 모니터링
        await this.testAuditLogsAndMonitoring();
        
        // 정리 작업
        await this.cleanup();
        
        this.generateReport();
    }

    async setupAdminEnvironment() {
        // 일반 사용자 인증
        try {
            const loginData = {
                email: 'test@example.com',
                password: 'Test123!'
            };

            const response = await axios.post(`${this.baseURL}/api/auth/login/`, loginData);
            this.authToken = response.data.access;
            console.log('✅ 일반 사용자 인증 성공');
        } catch (error) {
            console.log('❌ 일반 사용자 인증 실패:', error.message);
        }

        // 관리자 인증
        try {
            const adminLoginData = {
                email: 'admin@example.com',
                password: 'Admin123!'
            };

            const adminResponse = await axios.post(`${this.baseURL}/api/auth/login/`, adminLoginData);
            this.adminToken = adminResponse.data.access;
            console.log('✅ 관리자 인증 성공');
        } catch (error) {
            console.log('❌ 관리자 인증 실패:', error.message);
            
            // 관리자 계정이 없으면 생성 시도
            await this.createAdminAccount();
        }
    }

    async createAdminAccount() {
        try {
            // 슈퍼유저 생성 (실제 환경에서는 다른 방법 사용)
            const createAdminData = {
                email: 'admin@example.com',
                password: 'Admin123!',
                username: 'admin',
                first_name: 'Admin',
                last_name: 'User',
                is_staff: true,
                is_superuser: true
            };

            await axios.post(`${this.baseURL}/api/admin/create-superuser/`, createAdminData);
            
            // 다시 로그in 시도
            const adminResponse = await axios.post(`${this.baseURL}/api/auth/login/`, {
                email: 'admin@example.com',
                password: 'Admin123!'
            });
            
            this.adminToken = adminResponse.data.access;
            console.log('✅ 관리자 계정 생성 및 인증 성공');
            
        } catch (error) {
            console.log('❌ 관리자 계정 생성 실패:', error.message);
        }
    }

    async testUserManagement() {
        const scenario = {
            name: '사용자 관리 (생성, 수정, 삭제, 권한)',
            tests: [],
            criticalLevel: 'HIGH'
        };

        // 사용자 목록 조회
        try {
            const usersResponse = await axios.get(
                `${this.baseURL}/api/admin/users/`,
                {
                    headers: { 'Authorization': `Bearer ${this.adminToken}` }
                }
            );

            if (usersResponse.status === 200) {
                const users = usersResponse.data.results || usersResponse.data;
                
                scenario.tests.push({
                    name: '사용자 목록 조회',
                    status: 'PASS',
                    details: `${users.length}명 사용자 조회됨`
                });

                // 사용자 검색 기능
                const searchResponse = await axios.get(
                    `${this.baseURL}/api/admin/users/?search=test`,
                    {
                        headers: { 'Authorization': `Bearer ${this.adminToken}` }
                    }
                );

                scenario.tests.push({
                    name: '사용자 검색 기능',
                    status: searchResponse.status === 200 ? 'PASS' : 'FAIL',
                    details: `검색 결과: ${(searchResponse.data.results || searchResponse.data).length}명`
                });

            } else {
                scenario.tests.push({
                    name: '사용자 목록 조회',
                    status: 'FAIL',
                    details: `상태 코드: ${usersResponse.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '사용자 목록 조회',
                status: 'FAIL',
                details: `오류: ${error.message}`,
                severity: 'HIGH'
            });

            if (error.response?.status === 403) {
                this.testResults.criticalIssues.push({
                    issue: '관리자 권한 부족',
                    impact: '사용자 관리 기능 사용 불가',
                    urgency: 'HIGH'
                });
            }
        }

        // 새 사용자 생성
        const newUserData = {
            email: `testuser_${Date.now()}@example.com`,
            password: 'TestUser123!',
            username: `testuser_${Date.now()}`,
            first_name: '테스트',
            last_name: '사용자',
            is_active: true
        };

        try {
            const createResponse = await axios.post(
                `${this.baseURL}/api/admin/users/`,
                newUserData,
                {
                    headers: { 'Authorization': `Bearer ${this.adminToken}` }
                }
            );

            if (createResponse.status === 201) {
                this.testUsers.push(createResponse.data);
                
                scenario.tests.push({
                    name: '사용자 생성',
                    status: 'PASS',
                    details: `사용자 ID: ${createResponse.data.id}`
                });

                // 생성된 사용자 상세 조회
                const detailResponse = await axios.get(
                    `${this.baseURL}/api/admin/users/${createResponse.data.id}/`,
                    {
                        headers: { 'Authorization': `Bearer ${this.adminToken}` }
                    }
                );

                scenario.tests.push({
                    name: '사용자 상세 조회',
                    status: detailResponse.status === 200 ? 'PASS' : 'FAIL',
                    details: `조회된 이메일: ${detailResponse.data.email}`
                });

                // 사용자 정보 수정
                const updateData = {
                    first_name: '수정된',
                    last_name: '이름',
                    is_active: false
                };

                const updateResponse = await axios.patch(
                    `${this.baseURL}/api/admin/users/${createResponse.data.id}/`,
                    updateData,
                    {
                        headers: { 'Authorization': `Bearer ${this.adminToken}` }
                    }
                );

                scenario.tests.push({
                    name: '사용자 정보 수정',
                    status: updateResponse.status === 200 ? 'PASS' : 'FAIL',
                    details: `활성 상태: ${updateResponse.data.is_active}`
                });

            } else {
                scenario.tests.push({
                    name: '사용자 생성',
                    status: 'FAIL',
                    details: `상태 코드: ${createResponse.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '사용자 생성',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }

        // 권한 관리 테스트
        await this.testUserPermissions(scenario);

        this.testResults.scenarios.push(scenario);
    }

    async testUserPermissions(scenario) {
        if (this.testUsers.length === 0) return;

        const testUser = this.testUsers[0];

        // 권한 그룹 조회
        try {
            const groupsResponse = await axios.get(
                `${this.baseURL}/api/admin/groups/`,
                {
                    headers: { 'Authorization': `Bearer ${this.adminToken}` }
                }
            );

            scenario.tests.push({
                name: '권한 그룹 조회',
                status: groupsResponse.status === 200 ? 'PASS' : 'FAIL',
                details: `${(groupsResponse.data.results || groupsResponse.data).length}개 그룹`
            });

            // 사용자에게 권한 그룹 할당
            if (groupsResponse.status === 200) {
                const groups = groupsResponse.data.results || groupsResponse.data;
                if (groups.length > 0) {
                    const assignGroupData = {
                        groups: [groups[0].id]
                    };

                    const assignResponse = await axios.patch(
                        `${this.baseURL}/api/admin/users/${testUser.id}/`,
                        assignGroupData,
                        {
                            headers: { 'Authorization': `Bearer ${this.adminToken}` }
                        }
                    );

                    scenario.tests.push({
                        name: '권한 그룹 할당',
                        status: assignResponse.status === 200 ? 'PASS' : 'FAIL',
                        details: `그룹 ${groups[0].name} 할당됨`
                    });
                }
            }

        } catch (error) {
            scenario.tests.push({
                name: '권한 관리',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }
    }

    async testProjectManagement() {
        const scenario = {
            name: '프로젝트 관리 및 모니터링',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        // 모든 프로젝트 조회 (관리자 권한)
        try {
            const projectsResponse = await axios.get(
                `${this.baseURL}/api/admin/projects/`,
                {
                    headers: { 'Authorization': `Bearer ${this.adminToken}` }
                }
            );

            if (projectsResponse.status === 200) {
                const projects = projectsResponse.data.results || projectsResponse.data;
                
                scenario.tests.push({
                    name: '전체 프로젝트 조회',
                    status: 'PASS',
                    details: `${projects.length}개 프로젝트 관리 중`
                });

                // 프로젝트 상태별 통계
                const statusStats = {};
                projects.forEach(project => {
                    const status = project.status || 'unknown';
                    statusStats[status] = (statusStats[status] || 0) + 1;
                });

                scenario.tests.push({
                    name: '프로젝트 상태 통계',
                    status: 'PASS',
                    details: `상태별: ${Object.entries(statusStats).map(([k,v]) => `${k}:${v}`).join(', ')}`
                });

                // 비활성 프로젝트 관리
                const inactiveProjects = projects.filter(p => {
                    const lastUpdate = new Date(p.updated_at);
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return lastUpdate < monthAgo;
                });

                scenario.tests.push({
                    name: '비활성 프로젝트 식별',
                    status: 'PASS',
                    details: `${inactiveProjects.length}개 비활성 프로젝트`
                });

            } else {
                scenario.tests.push({
                    name: '전체 프로젝트 조회',
                    status: 'FAIL',
                    details: `상태 코드: ${projectsResponse.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '프로젝트 관리',
                status: 'FAIL',
                details: `오류: ${error.message}`,
                severity: 'MEDIUM'
            });
        }

        // 프로젝트 일괄 작업
        await this.testBulkProjectOperations(scenario);

        this.testResults.scenarios.push(scenario);
    }

    async testBulkProjectOperations(scenario) {
        // 프로젝트 일괄 상태 변경
        try {
            const bulkUpdateData = {
                project_ids: this.testProjects.map(p => p.id),
                action: 'update_status',
                new_status: 'archived'
            };

            const bulkResponse = await axios.post(
                `${this.baseURL}/api/admin/projects/bulk-update/`,
                bulkUpdateData,
                {
                    headers: { 'Authorization': `Bearer ${this.adminToken}` }
                }
            );

            scenario.tests.push({
                name: '프로젝트 일괄 상태 변경',
                status: bulkResponse.status === 200 ? 'PASS' : 'FAIL',
                details: `${this.testProjects.length}개 프로젝트 상태 변경`
            });

        } catch (error) {
            scenario.tests.push({
                name: '프로젝트 일괄 작업',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }
    }

    async testSystemAnalytics() {
        const scenario = {
            name: '시스템 통계 및 분석',
            tests: [],
            criticalLevel: 'LOW'
        };

        // 대시보드 통계
        try {
            const statsResponse = await axios.get(
                `${this.baseURL}/api/admin/dashboard/stats/`,
                {
                    headers: { 'Authorization': `Bearer ${this.adminToken}` }
                }
            );

            if (statsResponse.status === 200) {
                const stats = statsResponse.data;
                
                scenario.tests.push({
                    name: '대시보드 통계 조회',
                    status: 'PASS',
                    details: `사용자: ${stats.total_users || 'N/A'}, 프로젝트: ${stats.total_projects || 'N/A'}`
                });

                // 통계 데이터 완성도 확인
                const requiredStats = ['total_users', 'total_projects', 'active_projects', 'total_feedbacks'];
                const missingStats = requiredStats.filter(stat => stats[stat] === undefined);

                scenario.tests.push({
                    name: '통계 데이터 완성도',
                    status: missingStats.length === 0 ? 'PASS' : 'PARTIAL',
                    details: missingStats.length === 0 ? '모든 통계 사용 가능' : `누락: ${missingStats.join(', ')}`
                });

            } else {
                scenario.tests.push({
                    name: '대시보드 통계 조회',
                    status: 'FAIL',
                    details: `상태 코드: ${statsResponse.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '시스템 통계',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }

        // 사용자 활동 분석
        try {
            const activityResponse = await axios.get(
                `${this.baseURL}/api/admin/analytics/user-activity/`,
                {
                    headers: { 'Authorization': `Bearer ${this.adminToken}` },
                    params: {
                        period: '7days',
                        metric: 'daily_active_users'
                    }
                }
            );

            scenario.tests.push({
                name: '사용자 활동 분석',
                status: activityResponse.status === 200 ? 'PASS' : 'FAIL',
                details: activityResponse.status === 200 ? 
                    `${activityResponse.data.data_points?.length || 0}개 데이터 포인트` : 
                    `상태: ${activityResponse.status}`
            });

        } catch (error) {
            scenario.tests.push({
                name: '사용자 활동 분석',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }

        // 시스템 성능 메트릭
        try {
            const performanceResponse = await axios.get(
                `${this.baseURL}/api/admin/system/performance/`,
                {
                    headers: { 'Authorization': `Bearer ${this.adminToken}` }
                }
            );

            if (performanceResponse.status === 200) {
                const metrics = performanceResponse.data;
                
                scenario.tests.push({
                    name: '시스템 성능 메트릭',
                    status: 'PASS',
                    details: `응답시간: ${metrics.avg_response_time || 'N/A'}ms, CPU: ${metrics.cpu_usage || 'N/A'}%`
                });

                // 성능 경고 임계값 확인
                const warnings = [];
                if (metrics.avg_response_time > 1000) warnings.push('응답시간 지연');
                if (metrics.cpu_usage > 80) warnings.push('CPU 사용률 높음');
                if (metrics.memory_usage > 85) warnings.push('메모리 사용률 높음');

                scenario.tests.push({
                    name: '성능 상태 평가',
                    status: warnings.length === 0 ? 'PASS' : 'WARNING',
                    details: warnings.length === 0 ? '모든 지표 정상' : `경고: ${warnings.join(', ')}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '시스템 성능 모니터링',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async testSecurityManagement() {
        const scenario = {
            name: '권한 및 보안 관리',
            tests: [],
            criticalLevel: 'CRITICAL'
        };

        // 보안 설정 조회
        try {
            const securityResponse = await axios.get(
                `${this.baseURL}/api/admin/security/settings/`,
                {
                    headers: { 'Authorization': `Bearer ${this.adminToken}` }
                }
            );

            if (securityResponse.status === 200) {
                const settings = securityResponse.data;
                
                scenario.tests.push({
                    name: '보안 설정 조회',
                    status: 'PASS',
                    details: `2FA 활성화: ${settings.two_factor_enabled || false}`
                });

                // 보안 정책 검증
                const securityChecks = [
                    {
                        name: '비밀번호 정책',
                        check: settings.password_policy && settings.password_policy.min_length >= 8,
                        severity: 'HIGH'
                    },
                    {
                        name: '세션 타임아웃',
                        check: settings.session_timeout && settings.session_timeout <= 3600,
                        severity: 'MEDIUM'
                    },
                    {
                        name: 'API 요청 제한',
                        check: settings.rate_limiting_enabled === true,
                        severity: 'HIGH'
                    }
                ];

                securityChecks.forEach(check => {
                    scenario.tests.push({
                        name: `보안 정책: ${check.name}`,
                        status: check.check ? 'PASS' : 'FAIL',
                        details: check.check ? '정책 준수' : '정책 미준수',
                        severity: check.check ? 'NORMAL' : check.severity
                    });

                    if (!check.check) {
                        this.testResults.securityTests.push({
                            policy: check.name,
                            status: 'FAIL',
                            severity: check.severity
                        });
                    }
                });

            } else {
                scenario.tests.push({
                    name: '보안 설정 조회',
                    status: 'FAIL',
                    details: `상태 코드: ${securityResponse.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '보안 관리',
                status: 'FAIL',
                details: `오류: ${error.message}`,
                severity: 'CRITICAL'
            });
        }

        // 접근 제어 테스트
        await this.testAccessControl(scenario);

        // 로그인 시도 모니터링
        await this.testLoginAttemptMonitoring(scenario);

        this.testResults.scenarios.push(scenario);
    }

    async testAccessControl(scenario) {
        // 일반 사용자가 관리자 API에 접근 시도
        if (!this.authToken) return;

        try {
            const unauthorizedResponse = await axios.get(
                `${this.baseURL}/api/admin/users/`,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` } // 일반 사용자 토큰
                }
            );

            scenario.tests.push({
                name: '관리자 API 접근 제어',
                status: 'FAIL',
                details: '일반 사용자가 관리자 API에 접근 가능',
                severity: 'CRITICAL'
            });

            this.testResults.criticalIssues.push({
                issue: '관리자 API 접근 제어 실패',
                impact: '보안 위험 - 권한 없는 사용자가 관리 기능 접근 가능',
                urgency: 'IMMEDIATE'
            });

        } catch (error) {
            if (error.response && (error.response.status === 403 || error.response.status === 401)) {
                scenario.tests.push({
                    name: '관리자 API 접근 제어',
                    status: 'PASS',
                    details: '일반 사용자 접근 적절히 차단됨'
                });
            } else {
                scenario.tests.push({
                    name: '관리자 API 접근 제어',
                    status: 'FAIL',
                    details: `예상치 못한 오류: ${error.message}`
                });
            }
        }
    }

    async testLoginAttemptMonitoring(scenario) {
        try {
            const loginAttemptResponse = await axios.get(
                `${this.baseURL}/api/admin/security/login-attempts/`,
                {
                    headers: { 'Authorization': `Bearer ${this.adminToken}` },
                    params: {
                        period: '24hours',
                        status: 'failed'
                    }
                }
            );

            if (loginAttemptResponse.status === 200) {
                const attempts = loginAttemptResponse.data.results || loginAttemptResponse.data;
                
                scenario.tests.push({
                    name: '로그인 시도 모니터링',
                    status: 'PASS',
                    details: `24시간 내 실패한 로그인: ${attempts.length}건`
                });

                // 의심스러운 활동 탐지
                const suspiciousIPs = {};
                attempts.forEach(attempt => {
                    const ip = attempt.ip_address;
                    suspiciousIPs[ip] = (suspiciousIPs[ip] || 0) + 1;
                });

                const highRiskIPs = Object.entries(suspiciousIPs)
                    .filter(([ip, count]) => count >= 5)
                    .map(([ip, count]) => ({ ip, count }));

                scenario.tests.push({
                    name: '의심스러운 활동 탐지',
                    status: highRiskIPs.length === 0 ? 'PASS' : 'WARNING',
                    details: highRiskIPs.length === 0 ? 
                        '의심스러운 활동 없음' : 
                        `${highRiskIPs.length}개 IP에서 반복 실패`
                });

            } else {
                scenario.tests.push({
                    name: '로그인 시도 모니터링',
                    status: 'FAIL',
                    details: `상태 코드: ${loginAttemptResponse.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '로그인 시도 모니터링',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }
    }

    async testInvitationManagement() {
        const scenario = {
            name: '초대 시스템 관리',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        // 초대 목록 조회
        try {
            const invitationsResponse = await axios.get(
                `${this.baseURL}/api/admin/invitations/`,
                {
                    headers: { 'Authorization': `Bearer ${this.adminToken}` }
                }
            );

            if (invitationsResponse.status === 200) {
                const invitations = invitationsResponse.data.results || invitationsResponse.data;
                
                scenario.tests.push({
                    name: '초대 목록 조회',
                    status: 'PASS',
                    details: `${invitations.length}개 초대 관리 중`
                });

                // 초대 상태별 통계
                const statusStats = {};
                invitations.forEach(invitation => {
                    const status = invitation.status || 'unknown';
                    statusStats[status] = (statusStats[status] || 0) + 1;
                });

                scenario.tests.push({
                    name: '초대 상태 통계',
                    status: 'PASS',
                    details: `상태별: ${Object.entries(statusStats).map(([k,v]) => `${k}:${v}`).join(', ')}`
                });

            } else {
                scenario.tests.push({
                    name: '초대 목록 조회',
                    status: 'FAIL',
                    details: `상태 코드: ${invitationsResponse.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '초대 시스템 관리',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }

        // 만료된 초대 정리
        try {
            const cleanupResponse = await axios.post(
                `${this.baseURL}/api/admin/invitations/cleanup-expired/`,
                {},
                {
                    headers: { 'Authorization': `Bearer ${this.adminToken}` }
                }
            );

            scenario.tests.push({
                name: '만료된 초대 정리',
                status: cleanupResponse.status === 200 ? 'PASS' : 'FAIL',
                details: cleanupResponse.status === 200 ? 
                    `${cleanupResponse.data.cleaned_count || 0}개 초대 정리됨` : 
                    `상태: ${cleanupResponse.status}`
            });

        } catch (error) {
            scenario.tests.push({
                name: '만료된 초대 정리',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async testSystemConfiguration() {
        const scenario = {
            name: '시스템 설정 및 구성',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        // 시스템 설정 조회
        try {
            const configResponse = await axios.get(
                `${this.baseURL}/api/admin/system/config/`,
                {
                    headers: { 'Authorization': `Bearer ${this.adminToken}` }
                }
            );

            if (configResponse.status === 200) {
                const config = configResponse.data;
                
                scenario.tests.push({
                    name: '시스템 설정 조회',
                    status: 'PASS',
                    details: `${Object.keys(config).length}개 설정 항목`
                });

                // 중요 설정 확인
                const criticalSettings = [
                    { name: 'DEBUG', expected: false, current: config.DEBUG },
                    { name: 'ALLOWED_HOSTS', expected: 'array', current: Array.isArray(config.ALLOWED_HOSTS) },
                    { name: 'SECRET_KEY', expected: 'exists', current: !!config.SECRET_KEY }
                ];

                criticalSettings.forEach(setting => {
                    let status = 'PASS';
                    let details = '설정 정상';

                    if (setting.name === 'DEBUG' && setting.current === true) {
                        status = 'WARNING';
                        details = '운영 환경에서 DEBUG 모드 활성화됨';
                    } else if (setting.name === 'ALLOWED_HOSTS' && !setting.current) {
                        status = 'FAIL';
                        details = 'ALLOWED_HOSTS 설정 오류';
                    } else if (setting.name === 'SECRET_KEY' && !setting.current) {
                        status = 'FAIL';
                        details = 'SECRET_KEY 설정 누락';
                    }

                    scenario.tests.push({
                        name: `중요 설정: ${setting.name}`,
                        status: status,
                        details: details,
                        severity: status === 'FAIL' ? 'HIGH' : 'NORMAL'
                    });
                });

            } else {
                scenario.tests.push({
                    name: '시스템 설정 조회',
                    status: 'FAIL',
                    details: `상태 코드: ${configResponse.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '시스템 설정 관리',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }

        // 환경 변수 검증
        await this.testEnvironmentVariables(scenario);

        this.testResults.scenarios.push(scenario);
    }

    async testEnvironmentVariables(scenario) {
        try {
            const envResponse = await axios.get(
                `${this.baseURL}/api/admin/system/env-check/`,
                {
                    headers: { 'Authorization': `Bearer ${this.adminToken}` }
                }
            );

            if (envResponse.status === 200) {
                const envCheck = envResponse.data;
                
                scenario.tests.push({
                    name: '환경 변수 검증',
                    status: 'PASS',
                    details: `검증된 변수: ${envCheck.validated_vars?.length || 0}개`
                });

                // 누락된 환경 변수 확인
                if (envCheck.missing_vars && envCheck.missing_vars.length > 0) {
                    scenario.tests.push({
                        name: '누락된 환경 변수',
                        status: 'WARNING',
                        details: `누락: ${envCheck.missing_vars.join(', ')}`,
                        severity: 'MEDIUM'
                    });
                }

            } else {
                scenario.tests.push({
                    name: '환경 변수 검증',
                    status: 'FAIL',
                    details: `상태 코드: ${envResponse.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '환경 변수 검증',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }
    }

    async testAuditLogsAndMonitoring() {
        const scenario = {
            name: '감사 로그 및 모니터링',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        // 감사 로그 조회
        try {
            const auditResponse = await axios.get(
                `${this.baseURL}/api/admin/audit-logs/`,
                {
                    headers: { 'Authorization': `Bearer ${this.adminToken}` },
                    params: {
                        period: '7days',
                        action_type: 'all'
                    }
                }
            );

            if (auditResponse.status === 200) {
                const logs = auditResponse.data.results || auditResponse.data;
                
                scenario.tests.push({
                    name: '감사 로그 조회',
                    status: 'PASS',
                    details: `7일간 ${logs.length}건 로그`
                });

                // 로그 유형별 분석
                const actionTypes = {};
                logs.forEach(log => {
                    const action = log.action_type || 'unknown';
                    actionTypes[action] = (actionTypes[action] || 0) + 1;
                });

                scenario.tests.push({
                    name: '로그 유형별 분석',
                    status: 'PASS',
                    details: `유형: ${Object.entries(actionTypes).map(([k,v]) => `${k}:${v}`).join(', ')}`
                });

                // 민감한 작업 모니터링
                const sensitiveActions = logs.filter(log => 
                    ['user_delete', 'permission_change', 'system_config_change'].includes(log.action_type)
                );

                scenario.tests.push({
                    name: '민감한 작업 모니터링',
                    status: 'PASS',
                    details: `민감한 작업: ${sensitiveActions.length}건`
                });

            } else {
                scenario.tests.push({
                    name: '감사 로그 조회',
                    status: 'FAIL',
                    details: `상태 코드: ${auditResponse.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '감사 로그 시스템',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }

        // 시스템 상태 모니터링
        try {
            const healthResponse = await axios.get(
                `${this.baseURL}/api/admin/system/health/`,
                {
                    headers: { 'Authorization': `Bearer ${this.adminToken}` }
                }
            );

            if (healthResponse.status === 200) {
                const health = healthResponse.data;
                
                scenario.tests.push({
                    name: '시스템 상태 모니터링',
                    status: health.status === 'healthy' ? 'PASS' : 'WARNING',
                    details: `상태: ${health.status}, 응답시간: ${health.response_time}ms`
                });

                // 서비스별 상태 확인
                if (health.services) {
                    Object.entries(health.services).forEach(([service, status]) => {
                        scenario.tests.push({
                            name: `서비스 상태: ${service}`,
                            status: status === 'healthy' ? 'PASS' : 'FAIL',
                            details: `상태: ${status}`,
                            severity: status === 'healthy' ? 'NORMAL' : 'HIGH'
                        });
                    });
                }

            } else {
                scenario.tests.push({
                    name: '시스템 상태 모니터링',
                    status: 'FAIL',
                    details: `상태 코드: ${healthResponse.status}`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '시스템 상태 모니터링',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async cleanup() {
        console.log('🧹 관리자 테스트 정리 작업 시작...');
        
        // 생성된 테스트 사용자들 정리
        for (const user of this.testUsers) {
            try {
                await axios.delete(
                    `${this.baseURL}/api/admin/users/${user.id}/`,
                    {
                        headers: { 'Authorization': `Bearer ${this.adminToken}` }
                    }
                );
                console.log(`✅ 테스트 사용자 ${user.id} 정리 완료`);
            } catch (error) {
                console.log(`⚠️ 테스트 사용자 ${user.id} 정리 실패:`, error.message);
            }
        }

        // 생성된 테스트 프로젝트들 정리
        for (const project of this.testProjects) {
            try {
                await axios.delete(
                    `${this.baseURL}/api/admin/projects/${project.id}/`,
                    {
                        headers: { 'Authorization': `Bearer ${this.adminToken}` }
                    }
                );
                console.log(`✅ 테스트 프로젝트 ${project.id} 정리 완료`);
            } catch (error) {
                console.log(`⚠️ 테스트 프로젝트 ${project.id} 정리 실패:`, error.message);
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

        console.log('\n=== Journey 5: 관리자 기능 테스트 결과 ===');
        console.log(`총 테스트: ${this.testResults.totalTests}개`);
        console.log(`성공: ${this.testResults.passedTests}개`);
        console.log(`성공률: ${successRate}%`);

        // 보안 테스트 요약
        if (this.testResults.securityTests.length > 0) {
            console.log('\n🔒 보안 테스트 결과:');
            const criticalSecurityIssues = this.testResults.securityTests.filter(t => t.severity === 'HIGH');
            console.log(`중요 보안 이슈: ${criticalSecurityIssues.length}개`);
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
                const icon = test.status === 'PASS' ? '✅' : 
                           test.status === 'WARNING' ? '⚠️' : 
                           test.status === 'FAIL' ? '❌' : '⏸️';
                console.log(`  ${icon} ${test.name}: ${test.details}`);
            });
        });

        return this.testResults;
    }
}

// 모듈로 export
module.exports = AdminFunctionsJourneyTest;

// 직접 실행 시
if (require.main === module) {
    const journey = new AdminFunctionsJourneyTest();
    journey.runJourney().then(() => {
        console.log('\n🎉 Journey 5 테스트 완료!');
    }).catch(error => {
        console.error('❌ Journey 5 테스트 실행 중 오류:', error.message);
    });
}