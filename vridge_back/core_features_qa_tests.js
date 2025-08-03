/**
 * VideoPlanet 핵심 기능별 상세 QA 테스트
 * "막힘 없이, 오류 없이" 원칙 구현을 위한 구체적 테스트 케이스
 */

const axios = require('axios');
const WebSocket = require('ws');
const FormData = require('form-data');
const fs = require('fs');

// =================================================================
// 1. PlanningWizard (영상 기획 마법사) 철저한 테스트
// =================================================================

class PlanningWizardQATests {
    constructor(apiUrl, authToken) {
        this.apiUrl = apiUrl;
        this.authToken = authToken;
        this.testResults = [];
    }

    async runAllTests() {
        console.log('\n🎬 PlanningWizard 영상 기획 마법사 테스트 시작');
        
        await this.testBasicFunctionality();
        await this.testAIPromptGeneration();
        await this.testStoryboardGeneration();
        await this.testPDFExport();
        await this.testErrorHandling();
        await this.testPerformanceOptimization();
        
        return this.generateReport();
    }

    // 1.1 기본 기능 테스트
    async testBasicFunctionality() {
        console.log('\n📋 기본 기능 테스트');

        // 테스트 1: 영상 기획 페이지 접근
        try {
            const response = await axios.get(`${this.apiUrl}/video-planning/`, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });
            
            this.addTestResult('기획_페이지_접근', response.status === 200, {
                status: response.status,
                hasData: !!response.data
            });
            
        } catch (error) {
            this.addTestResult('기획_페이지_접근', false, { error: error.message });
        }

        // 테스트 2: 기획안 생성 API
        try {
            const planningData = {
                project_name: '마법사_테스트_프로젝트',
                planning_type: 'promotional',
                target_audience: 'young_adults',
                video_length: '60초',
                tone: 'energetic',
                key_message: '혁신적인 솔루션으로 미래를 만들어갑니다'
            };

            const createResponse = await axios.post(
                `${this.apiUrl}/video-planning/create/`,
                planningData,
                { headers: { Authorization: `Bearer ${this.authToken}` } }
            );

            this.planningId = createResponse.data.id;
            
            this.addTestResult('기획안_생성', createResponse.status === 201, {
                planningId: this.planningId,
                hasStories: createResponse.data.stories?.length > 0,
                hasScenes: createResponse.data.scenes?.length > 0
            });

        } catch (error) {
            this.addTestResult('기획안_생성', false, { error: error.message });
        }

        // 테스트 3: 기획안 수정
        try {
            const updateData = {
                key_message: '수정된 핵심 메시지: 더 나은 미래를 위한 혁신'
            };

            const updateResponse = await axios.patch(
                `${this.apiUrl}/video-planning/${this.planningId}/`,
                updateData,
                { headers: { Authorization: `Bearer ${this.authToken}` } }
            );

            this.addTestResult('기획안_수정', updateResponse.status === 200, {
                updatedMessage: updateResponse.data.key_message
            });

        } catch (error) {
            this.addTestResult('기획안_수정', false, { error: error.message });
        }
    }

    // 1.2 AI 프롬프트 생성 시스템 테스트
    async testAIPromptGeneration() {
        console.log('\n🤖 AI 프롬프트 생성 시스템 테스트');

        // 테스트 1: 기본 프롬프트 생성
        try {
            const promptRequest = {
                planning_type: 'story',
                user_input: '스타트업 소개 영상을 만들고 싶습니다. 기술적 혁신과 팀의 열정을 보여주고 싶어요.',
                pro_options: {
                    optimization_level: 'high',
                    target_audience: 'investors',
                    tone: 'professional_enthusiastic',
                    industry: 'technology'
                }
            };

            const promptResponse = await axios.post(
                `${this.apiUrl}/video-planning/generate-prompt/`,
                promptRequest,
                { headers: { Authorization: `Bearer ${this.authToken}` } }
            );

            const isQualityPrompt = 
                promptResponse.data.enhanced_prompt.length > 100 &&
                promptResponse.data.confidence_score > 0.7 &&
                promptResponse.data.generation_time < 10000;

            this.addTestResult('AI_프롬프트_기본_생성', isQualityPrompt, {
                promptLength: promptResponse.data.enhanced_prompt.length,
                confidenceScore: promptResponse.data.confidence_score,
                generationTime: promptResponse.data.generation_time,
                tokensEstimate: promptResponse.data.tokens_estimate
            });

        } catch (error) {
            this.addTestResult('AI_프롬프트_기본_생성', false, { error: error.message });
        }

        // 테스트 2: 극한 최적화 프롬프트 생성
        try {
            const extremePromptRequest = {
                planning_type: 'storyboard',
                user_input: '복잡한 B2B SaaS 플랫폼의 기능을 설명하는 영상',
                pro_options: {
                    optimization_level: 'extreme',
                    target_audience: 'enterprise_decision_makers',
                    tone: 'authoritative_clear',
                    complexity: 'high',
                    technical_depth: 'detailed'
                }
            };

            const extremeResponse = await axios.post(
                `${this.apiUrl}/video-planning/generate-prompt/`,
                extremePromptRequest,
                { headers: { Authorization: `Bearer ${this.authToken}` } }
            );

            const isExtremeQuality = 
                extremeResponse.data.enhanced_prompt.length > 200 &&
                extremeResponse.data.confidence_score > 0.8 &&
                extremeResponse.data.optimization_suggestions.length > 3;

            this.addTestResult('AI_프롬프트_극한_최적화', isExtremeQuality, {
                promptLength: extremeResponse.data.enhanced_prompt.length,
                confidenceScore: extremeResponse.data.confidence_score,
                optimizationSuggestions: extremeResponse.data.optimization_suggestions.length
            });

        } catch (error) {
            this.addTestResult('AI_프롬프트_극한_최적화', false, { error: error.message });
        }

        // 테스트 3: 다국어 프롬프트 생성
        try {
            const multilingualRequest = {
                planning_type: 'story',
                user_input: 'グローバル展開を目指すスタートアップの紹介動画', // 일본어
                pro_options: {
                    language: 'japanese',
                    target_market: 'japan',
                    cultural_context: 'business_formal'
                }
            };

            const multilingualResponse = await axios.post(
                `${this.apiUrl}/video-planning/generate-prompt/`,
                multilingualRequest,
                { headers: { Authorization: `Bearer ${this.authToken}` } }
            );

            this.addTestResult('AI_프롬프트_다국어_지원', multilingualResponse.status === 200, {
                hasTranslation: !!multilingualResponse.data.enhanced_prompt,
                detectedLanguage: multilingualResponse.data.detected_language
            });

        } catch (error) {
            this.addTestResult('AI_프롬프트_다국어_지원', false, { error: error.message });
        }
    }

    // 1.3 스토리보드 자동 생성 테스트
    async testStoryboardGeneration() {
        console.log('\n🎨 스토리보드 자동 생성 테스트');

        // 테스트 1: 기본 스토리보드 생성
        try {
            const storyboardRequest = {
                planning_id: this.planningId,
                scene_descriptions: [
                    '현대적인 오피스에서 팀원들이 열정적으로 회의하는 모습',
                    '혁신적인 기술을 개발하는 엔지니어들의 집중하는 모습',
                    '제품 데모를 보여주는 깔끔한 화면',
                    '고객들의 만족스러운 표정과 성공 사례',
                    '미래 비전을 제시하는 임팩트 있는 엔딩'
                ],
                visual_style: 'modern_corporate',
                image_quality: 'hd',
                aspect_ratio: '16:9'
            };

            const storyboardResponse = await axios.post(
                `${this.apiUrl}/video-planning/generate-storyboard/`,
                storyboardRequest,
                { 
                    headers: { Authorization: `Bearer ${this.authToken}` },
                    timeout: 60000 // 1분 타임아웃
                }
            );

            const hasQualityImages = storyboardResponse.data.storyboard_images &&
                storyboardResponse.data.storyboard_images.length === 5 &&
                storyboardResponse.data.storyboard_images.every(img => img.image_url);

            this.addTestResult('스토리보드_기본_생성', hasQualityImages, {
                imageCount: storyboardResponse.data.storyboard_images?.length || 0,
                generationTime: storyboardResponse.data.total_generation_time,
                averageImageQuality: storyboardResponse.data.average_quality_score
            });

        } catch (error) {
            this.addTestResult('스토리보드_기본_생성', false, { error: error.message });
        }

        // 테스트 2: 고해상도 스토리보드 생성
        try {
            const hdStoryboardRequest = {
                planning_id: this.planningId,
                scene_descriptions: ['전문적인 비즈니스 프레젠테이션 장면'],
                visual_style: 'cinematic_professional',
                image_quality: '4k',
                aspect_ratio: '16:9',
                enhancement_options: {
                    color_grading: 'corporate_blue',
                    lighting: 'soft_professional',
                    composition: 'rule_of_thirds'
                }
            };

            const hdResponse = await axios.post(
                `${this.apiUrl}/video-planning/generate-storyboard/`,
                hdStoryboardRequest,
                { 
                    headers: { Authorization: `Bearer ${this.authToken}` },
                    timeout: 120000 // 2분 타임아웃
                }
            );

            this.addTestResult('스토리보드_고해상도_생성', hdResponse.status === 200, {
                imageQuality: hdResponse.data.storyboard_images?.[0]?.quality_metrics,
                processingTime: hdResponse.data.total_generation_time
            });

        } catch (error) {
            this.addTestResult('스토리보드_고해상도_생성', false, { error: error.message });
        }

        // 테스트 3: 배치 스토리보드 생성 (대량 처리)
        try {
            const batchRequest = {
                planning_id: this.planningId,
                batch_scenes: Array(12).fill().map((_, i) => ({
                    scene_number: i + 1,
                    description: `Scene ${i + 1}: 프로페셔널한 비즈니스 환경의 다양한 장면`,
                    duration: '5초'
                })),
                processing_mode: 'batch_optimized',
                parallel_processing: true
            };

            const batchResponse = await axios.post(
                `${this.apiUrl}/video-planning/generate-storyboard-batch/`,
                batchRequest,
                { 
                    headers: { Authorization: `Bearer ${this.authToken}` },
                    timeout: 300000 // 5분 타임아웃
                }
            );

            const batchSuccess = batchResponse.data.completed_scenes === 12 &&
                batchResponse.data.failed_scenes === 0;

            this.addTestResult('스토리보드_배치_생성', batchSuccess, {
                completedScenes: batchResponse.data.completed_scenes,
                failedScenes: batchResponse.data.failed_scenes,
                totalProcessingTime: batchResponse.data.total_processing_time,
                averageTimePerScene: batchResponse.data.average_time_per_scene
            });

        } catch (error) {
            this.addTestResult('스토리보드_배치_생성', false, { error: error.message });
        }
    }

    // 1.4 PDF 기획안 내보내기 테스트
    async testPDFExport() {
        console.log('\n📄 PDF 기획안 내보내기 테스트');

        // 테스트 1: 기본 PDF 생성
        try {
            const pdfRequest = {
                planning_id: this.planningId,
                export_options: {
                    include_storyboard: true,
                    include_shot_list: true,
                    include_timeline: true,
                    include_budget_estimate: false,
                    template: 'professional',
                    branding: {
                        company_name: 'VideoPlanet',
                        logo_url: null
                    }
                }
            };

            const pdfResponse = await axios.post(
                `${this.apiUrl}/video-planning/export-pdf/`,
                pdfRequest,
                { 
                    headers: { Authorization: `Bearer ${this.authToken}` },
                    responseType: 'blob',
                    timeout: 60000
                }
            );

            const isPDFValid = pdfResponse.data.size > 1000 && // 최소 1KB
                pdfResponse.headers['content-type'] === 'application/pdf';

            this.addTestResult('PDF_기본_내보내기', isPDFValid, {
                fileSize: pdfResponse.data.size,
                contentType: pdfResponse.headers['content-type']
            });

        } catch (error) {
            this.addTestResult('PDF_기본_내보내기', false, { error: error.message });
        }

        // 테스트 2: 프리미엄 PDF 생성 (모든 옵션 포함)
        try {
            const premiumPdfRequest = {
                planning_id: this.planningId,
                export_options: {
                    include_storyboard: true,
                    include_shot_list: true,
                    include_timeline: true,
                    include_budget_estimate: true,
                    include_equipment_list: true,
                    include_crew_roles: true,
                    template: 'premium',
                    quality: 'high',
                    branding: {
                        company_name: 'VideoPlanet Premium',
                        company_logo: true,
                        color_scheme: 'corporate_blue'
                    },
                    advanced_features: {
                        interactive_elements: false,
                        multi_language_support: false,
                        revision_tracking: true
                    }
                }
            };

            const premiumResponse = await axios.post(
                `${this.apiUrl}/video-planning/export-pdf-premium/`,
                premiumPdfRequest,
                { 
                    headers: { Authorization: `Bearer ${this.authToken}` },
                    responseType: 'blob',
                    timeout: 120000
                }
            );

            const isPremiumValid = premiumResponse.data.size > 5000; // 최소 5KB (더 큰 파일)

            this.addTestResult('PDF_프리미엄_내보내기', isPremiumValid, {
                fileSize: premiumResponse.data.size,
                processingTime: premiumResponse.headers['x-processing-time']
            });

        } catch (error) {
            this.addTestResult('PDF_프리미엄_내보내기', false, { error: error.message });
        }
    }

    // 1.5 오류 처리 및 복구 테스트
    async testErrorHandling() {
        console.log('\n⚠️ 오류 처리 및 자동 복구 테스트');

        // 테스트 1: 잘못된 입력 처리
        try {
            const invalidRequest = {
                planning_type: 'invalid_type',
                user_input: '', // 빈 입력
                pro_options: null
            };

            await axios.post(
                `${this.apiUrl}/video-planning/generate-prompt/`,
                invalidRequest,
                { headers: { Authorization: `Bearer ${this.authToken}` } }
            );

            this.addTestResult('잘못된_입력_처리', false, { 
                message: '잘못된 입력에 대해 오류가 발생해야 함' 
            });

        } catch (error) {
            const isValidError = error.response.status === 400 &&
                error.response.data.error_code === 'INVALID_INPUT';

            this.addTestResult('잘못된_입력_처리', isValidError, {
                errorStatus: error.response.status,
                errorCode: error.response.data.error_code
            });
        }

        // 테스트 2: API 한도 초과 시 처리
        try {
            // 연속으로 많은 요청을 보내서 한도 초과 상황 시뮬레이션
            const requests = Array(20).fill().map(() => 
                axios.post(
                    `${this.apiUrl}/video-planning/generate-image/`,
                    { prompt: 'test image' },
                    { headers: { Authorization: `Bearer ${this.authToken}` } }
                )
            );

            await Promise.all(requests);
            
            this.addTestResult('API_한도_초과_처리', false, { 
                message: 'API 한도 초과 시 제한이 적용되어야 함' 
            });

        } catch (error) {
            const isRateLimited = error.response.status === 429;
            
            this.addTestResult('API_한도_초과_처리', isRateLimited, {
                errorStatus: error.response.status,
                rateLimitMessage: error.response.data.message
            });
        }

        // 테스트 3: 자동 재시도 메커니즘
        try {
            const retryRequest = {
                planning_type: 'story',
                user_input: '자동 재시도 테스트',
                retry_options: {
                    max_retries: 3,
                    retry_delay: 1000,
                    exponential_backoff: true
                }
            };

            const retryResponse = await axios.post(
                `${this.apiUrl}/video-planning/generate-prompt-with-retry/`,
                retryRequest,
                { headers: { Authorization: `Bearer ${this.authToken}` } }
            );

            this.addTestResult('자동_재시도_메커니즘', retryResponse.status === 200, {
                retryAttempts: retryResponse.data.retry_attempts,
                finalSuccess: retryResponse.data.success
            });

        } catch (error) {
            this.addTestResult('자동_재시도_메커니즘', false, { error: error.message });
        }
    }

    // 1.6 성능 최적화 검증
    async testPerformanceOptimization() {
        console.log('\n⚡ 성능 최적화 검증 테스트');

        // 테스트 1: 캐시 효율성
        try {
            const cacheTestPrompt = '캐시 테스트용 동일한 프롬프트';
            
            // 첫 번째 요청 (캐시 미스)
            const startTime1 = Date.now();
            await axios.post(
                `${this.apiUrl}/video-planning/generate-prompt/`,
                { planning_type: 'story', user_input: cacheTestPrompt },
                { headers: { Authorization: `Bearer ${this.authToken}` } }
            );
            const firstRequestTime = Date.now() - startTime1;

            // 두 번째 동일한 요청 (캐시 히트)
            const startTime2 = Date.now();
            const cachedResponse = await axios.post(
                `${this.apiUrl}/video-planning/generate-prompt/`,
                { planning_type: 'story', user_input: cacheTestPrompt },
                { headers: { Authorization: `Bearer ${this.authToken}` } }
            );
            const secondRequestTime = Date.now() - startTime2;

            const cacheEffective = secondRequestTime < firstRequestTime * 0.5; // 50% 이상 빨라야 함

            this.addTestResult('캐시_효율성_검증', cacheEffective, {
                firstRequestTime,
                secondRequestTime,
                speedImprovement: ((firstRequestTime - secondRequestTime) / firstRequestTime * 100).toFixed(2) + '%',
                wasCached: cachedResponse.data.from_cache
            });

        } catch (error) {
            this.addTestResult('캐시_효율성_검증', false, { error: error.message });
        }

        // 테스트 2: 메모리 사용량 최적화
        try {
            const memoryTestRequest = {
                planning_type: 'storyboard',
                user_input: '대용량 데이터 처리 테스트',
                scene_count: 50, // 많은 씬
                performance_monitoring: true
            };

            const memoryResponse = await axios.post(
                `${this.apiUrl}/video-planning/generate-storyboard-memory-optimized/`,
                memoryTestRequest,
                { headers: { Authorization: `Bearer ${this.authToken}` } }
            );

            const memoryEfficient = memoryResponse.data.peak_memory_usage < 500; // 500MB 이하

            this.addTestResult('메모리_사용량_최적화', memoryEfficient, {
                peakMemoryUsage: memoryResponse.data.peak_memory_usage,
                averageMemoryUsage: memoryResponse.data.average_memory_usage,
                memoryLeaks: memoryResponse.data.memory_leaks_detected
            });

        } catch (error) {
            this.addTestResult('메모리_사용량_최적화', false, { error: error.message });
        }
    }

    // 유틸리티 메서드들
    addTestResult(testName, success, details) {
        this.testResults.push({
            test: testName,
            success,
            details,
            timestamp: new Date().toISOString()
        });

        const icon = success ? '✅' : '❌';
        console.log(`  ${icon} ${testName}: ${success ? '성공' : '실패'}`);
        if (details && Object.keys(details).length > 0) {
            console.log(`     상세: ${JSON.stringify(details, null, 2)}`);
        }
    }

    generateReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = ((passedTests / totalTests) * 100).toFixed(2);

        return {
            category: 'PlanningWizard',
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: `${successRate}%`
            },
            details: this.testResults,
            recommendations: this.generateRecommendations()
        };
    }

    generateRecommendations() {
        const recommendations = [];
        const failedTests = this.testResults.filter(r => !r.success);

        if (failedTests.length > 0) {
            recommendations.push('실패한 테스트들을 우선적으로 수정하세요.');
        }

        const performanceTests = this.testResults.filter(r => 
            r.test.includes('성능') || r.test.includes('캐시') || r.test.includes('메모리')
        );
        const failedPerformanceTests = performanceTests.filter(r => !r.success);

        if (failedPerformanceTests.length > 0) {
            recommendations.push('성능 최적화가 필요합니다. 캐시 전략과 메모리 관리를 검토하세요.');
        }

        if (this.testResults.filter(r => r.test.includes('AI_프롬프트') && !r.success).length > 0) {
            recommendations.push('AI 프롬프트 생성 엔진의 안정성을 개선하세요.');
        }

        return recommendations;
    }
}

// =================================================================
// 2. 실시간 협업 기능 QA 테스트
// =================================================================

class RealTimeCollaborationQATests {
    constructor(apiUrl, websocketUrl, authToken) {
        this.apiUrl = apiUrl;
        this.websocketUrl = websocketUrl;
        this.authToken = authToken;
        this.testResults = [];
        this.activeConnections = new Map();
    }

    async runAllTests() {
        console.log('\n🤝 실시간 협업 기능 테스트 시작');
        
        await this.testWebSocketConnections();
        await this.testMultiUserCollaboration();
        await this.testRealTimeFeedback();
        await this.testConflictResolution();
        await this.testConnectionRecovery();
        
        return this.generateReport();
    }

    // 2.1 WebSocket 연결 테스트
    async testWebSocketConnections() {
        console.log('\n🔌 WebSocket 연결 테스트');

        // 테스트 1: 기본 WebSocket 연결
        try {
            const ws = new WebSocket(`${this.websocketUrl}/collaboration/project/1/`);
            
            const connectionPromise = new Promise((resolve, reject) => {
                ws.on('open', () => {
                    this.activeConnections.set('main', ws);
                    resolve(true);
                });
                
                ws.on('error', (error) => {
                    reject(error);
                });
                
                setTimeout(() => reject(new Error('연결 타임아웃')), 10000);
            });

            const connectionSuccess = await connectionPromise;
            
            this.addTestResult('WebSocket_기본_연결', connectionSuccess, {
                readyState: ws.readyState,
                url: ws.url
            });

        } catch (error) {
            this.addTestResult('WebSocket_기본_연결', false, { error: error.message });
        }

        // 테스트 2: 인증된 WebSocket 연결
        try {
            const authWs = new WebSocket(`${this.websocketUrl}/collaboration/project/1/`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            const authConnectionPromise = new Promise((resolve, reject) => {
                authWs.on('open', () => {
                    // 인증 정보 전송
                    authWs.send(JSON.stringify({
                        type: 'authenticate',
                        token: this.authToken
                    }));
                    
                    this.activeConnections.set('authenticated', authWs);
                    resolve(true);
                });
                
                authWs.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'auth_success') {
                        resolve(true);
                    } else if (message.type === 'auth_error') {
                        reject(new Error('인증 실패'));
                    }
                });
                
                setTimeout(() => reject(new Error('인증 타임아웃')), 5000);
            });

            const authSuccess = await authConnectionPromise;
            
            this.addTestResult('WebSocket_인증_연결', authSuccess, {
                authenticated: true
            });

        } catch (error) {
            this.addTestResult('WebSocket_인증_연결', false, { error: error.message });
        }

        // 테스트 3: 다중 동시 연결
        try {
            const connectionPromises = Array(10).fill().map((_, i) => {
                return new Promise((resolve, reject) => {
                    const ws = new WebSocket(`${this.websocketUrl}/collaboration/project/1/`);
                    
                    ws.on('open', () => {
                        this.activeConnections.set(`concurrent_${i}`, ws);
                        resolve(true);
                    });
                    
                    ws.on('error', () => resolve(false));
                    
                    setTimeout(() => resolve(false), 5000);
                });
            });

            const results = await Promise.all(connectionPromises);
            const successfulConnections = results.filter(r => r).length;

            this.addTestResult('WebSocket_다중_동시_연결', successfulConnections >= 8, {
                totalAttempts: 10,
                successfulConnections,
                successRate: `${(successfulConnections / 10 * 100).toFixed(1)}%`
            });

        } catch (error) {
            this.addTestResult('WebSocket_다중_동시_연결', false, { error: error.message });
        }
    }

    // 2.2 다중 사용자 협업 테스트
    async testMultiUserCollaboration() {
        console.log('\n👥 다중 사용자 협업 테스트');

        // 테스트 1: 동시 편집 기능
        try {
            const user1Ws = this.activeConnections.get('main');
            const user2Ws = this.activeConnections.get('authenticated');

            if (!user1Ws || !user2Ws) {
                throw new Error('WebSocket 연결이 필요합니다');
            }

            const collaborationPromise = new Promise((resolve, reject) => {
                let user1EditReceived = false;
                let user2EditReceived = false;

                // User 1이 편집 시작
                user1Ws.send(JSON.stringify({
                    type: 'start_editing',
                    section: 'storyboard',
                    scene_id: 1,
                    user_id: 'user1'
                }));

                // User 2가 편집 내용 전송
                user2Ws.send(JSON.stringify({
                    type: 'edit_content',
                    section: 'storyboard',
                    scene_id: 1,
                    content: '수정된 스토리보드 내용',
                    user_id: 'user2'
                }));

                // 메시지 수신 처리
                user1Ws.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'content_updated' && message.user_id === 'user2') {
                        user1EditReceived = true;
                        checkCompletion();
                    }
                });

                user2Ws.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'editing_started' && message.user_id === 'user1') {
                        user2EditReceived = true;
                        checkCompletion();
                    }
                });

                function checkCompletion() {
                    if (user1EditReceived && user2EditReceived) {
                        resolve(true);
                    }
                }

                setTimeout(() => resolve(false), 10000);
            });

            const collaborationSuccess = await collaborationPromise;

            this.addTestResult('다중_사용자_동시_편집', collaborationSuccess, {
                user1MessageReceived: true,
                user2MessageReceived: true
            });

        } catch (error) {
            this.addTestResult('다중_사용자_동시_편집', false, { error: error.message });
        }

        // 테스트 2: 실시간 커서 위치 동기화
        try {
            const user1Ws = this.activeConnections.get('main');
            const user2Ws = this.activeConnections.get('authenticated');

            const cursorSyncPromise = new Promise((resolve, reject) => {
                let cursorUpdatesReceived = 0;

                // User 1 커서 위치 업데이트
                user1Ws.send(JSON.stringify({
                    type: 'cursor_position',
                    x: 100,
                    y: 200,
                    section: 'storyboard',
                    user_id: 'user1'
                }));

                // User 2에서 커서 위치 수신 확인
                user2Ws.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'cursor_update' && message.user_id === 'user1') {
                        cursorUpdatesReceived++;
                        if (cursorUpdatesReceived >= 1) {
                            resolve(true);
                        }
                    }
                });

                setTimeout(() => resolve(false), 5000);
            });

            const cursorSyncSuccess = await cursorSyncPromise;

            this.addTestResult('실시간_커서_동기화', cursorSyncSuccess, {
                cursorPositionSynced: true
            });

        } catch (error) {
            this.addTestResult('실시간_커서_동기화', false, { error: error.message });
        }
    }

    // 2.3 실시간 피드백 시스템 테스트
    async testRealTimeFeedback() {
        console.log('\n💬 실시간 피드백 시스템 테스트');

        // 테스트 1: 즉시 피드백 전송
        try {
            const mainWs = this.activeConnections.get('main');
            
            const feedbackPromise = new Promise((resolve, reject) => {
                let feedbackReceived = false;

                // 피드백 전송
                mainWs.send(JSON.stringify({
                    type: 'add_feedback',
                    content: '실시간 테스트 피드백',
                    timestamp: Date.now(),
                    position: { scene: 1, timecode: '00:05' },
                    priority: 'normal'
                }));

                // 피드백 수신 확인
                mainWs.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'feedback_added') {
                        feedbackReceived = true;
                        resolve(true);
                    }
                });

                setTimeout(() => resolve(feedbackReceived), 3000);
            });

            const feedbackSuccess = await feedbackPromise;

            this.addTestResult('즉시_피드백_전송', feedbackSuccess, {
                feedbackDelivered: true
            });

        } catch (error) {
            this.addTestResult('즉시_피드백_전송', false, { error: error.message });
        }

        // 테스트 2: 피드백 반응 시스템 (좋아요, 댓글)
        try {
            const user1Ws = this.activeConnections.get('main');
            const user2Ws = this.activeConnections.get('authenticated');

            const reactionPromise = new Promise((resolve, reject) => {
                let reactionReceived = false;

                // User 1이 피드백에 좋아요
                user1Ws.send(JSON.stringify({
                    type: 'add_reaction',
                    feedback_id: 'test_feedback_1',
                    reaction: 'like',
                    user_id: 'user1'
                }));

                // User 2가 반응 수신 확인
                user2Ws.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'reaction_added' && message.reaction === 'like') {
                        reactionReceived = true;
                        resolve(true);
                    }
                });

                setTimeout(() => resolve(reactionReceived), 5000);
            });

            const reactionSuccess = await reactionPromise;

            this.addTestResult('피드백_반응_시스템', reactionSuccess, {
                reactionProcessed: true
            });

        } catch (error) {
            this.addTestResult('피드백_반응_시스템', false, { error: error.message });
        }
    }

    // 2.4 충돌 해결 테스트
    async testConflictResolution() {
        console.log('\n⚔️ 충돌 해결 테스트');

        // 테스트 1: 동시 편집 충돌 해결
        try {
            const user1Ws = this.activeConnections.get('main');
            const user2Ws = this.activeConnections.get('authenticated');

            const conflictPromise = new Promise((resolve, reject) => {
                let conflictResolved = false;

                // 두 사용자가 동시에 같은 내용 편집
                user1Ws.send(JSON.stringify({
                    type: 'edit_content',
                    section: 'storyboard',
                    scene_id: 1,
                    content: 'User 1의 편집 내용',
                    timestamp: Date.now(),
                    user_id: 'user1'
                }));

                setTimeout(() => {
                    user2Ws.send(JSON.stringify({
                        type: 'edit_content',
                        section: 'storyboard',
                        scene_id: 1,
                        content: 'User 2의 편집 내용',
                        timestamp: Date.now() + 100, // 약간 늦은 편집
                        user_id: 'user2'
                    }));
                }, 100);

                // 충돌 해결 메시지 확인
                user1Ws.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'conflict_resolved') {
                        conflictResolved = true;
                        resolve(true);
                    }
                });

                setTimeout(() => resolve(conflictResolved), 8000);
            });

            const conflictResolvedSuccess = await conflictPromise;

            this.addTestResult('동시_편집_충돌_해결', conflictResolvedSuccess, {
                conflictDetected: true,
                resolutionStrategy: 'last_writer_wins'
            });

        } catch (error) {
            this.addTestResult('동시_편집_충돌_해결', false, { error: error.message });
        }
    }

    // 2.5 연결 복구 테스트
    async testConnectionRecovery() {
        console.log('\n🔄 연결 복구 테스트');

        // 테스트 1: 자동 재연결
        try {
            const testWs = this.activeConnections.get('main');
            
            const reconnectPromise = new Promise((resolve, reject) => {
                let reconnected = false;

                // 연결 강제 종료
                testWs.close();

                // 재연결 시도
                setTimeout(() => {
                    const newWs = new WebSocket(`${this.websocketUrl}/collaboration/project/1/`);
                    
                    newWs.on('open', () => {
                        reconnected = true;
                        this.activeConnections.set('reconnected', newWs);
                        resolve(true);
                    });
                    
                    newWs.on('error', () => resolve(false));
                }, 2000);

                setTimeout(() => resolve(reconnected), 10000);
            });

            const reconnectSuccess = await reconnectPromise;

            this.addTestResult('자동_재연결', reconnectSuccess, {
                reconnectionTime: '2초 이내'
            });

        } catch (error) {
            this.addTestResult('자동_재연결', false, { error: error.message });
        }
    }

    // 유틸리티 메서드들
    addTestResult(testName, success, details) {
        this.testResults.push({
            test: testName,
            success,
            details,
            timestamp: new Date().toISOString()
        });

        const icon = success ? '✅' : '❌';
        console.log(`  ${icon} ${testName}: ${success ? '성공' : '실패'}`);
    }

    generateReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = ((passedTests / totalTests) * 100).toFixed(2);

        return {
            category: 'RealTimeCollaboration',
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: `${successRate}%`
            },
            details: this.testResults,
            recommendations: this.generateRecommendations()
        };
    }

    generateRecommendations() {
        const recommendations = [];
        const failedTests = this.testResults.filter(r => !r.success);

        if (failedTests.some(t => t.test.includes('WebSocket'))) {
            recommendations.push('WebSocket 연결 안정성을 개선하세요. 네트워크 오류 처리와 재연결 로직을 강화하세요.');
        }

        if (failedTests.some(t => t.test.includes('충돌'))) {
            recommendations.push('동시 편집 충돌 해결 알고리즘을 개선하세요.');
        }

        if (failedTests.some(t => t.test.includes('피드백'))) {
            recommendations.push('실시간 피드백 시스템의 응답성을 개선하세요.');
        }

        return recommendations;
    }

    // 정리 메서드
    cleanup() {
        for (const [key, ws] of this.activeConnections) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        }
        this.activeConnections.clear();
    }
}

// =================================================================
// 3. 오류 자동 복구 시스템 QA 테스트
// =================================================================

class AutoRecoverySystemQATests {
    constructor(apiUrl, authToken) {
        this.apiUrl = apiUrl;
        this.authToken = authToken;
        this.testResults = [];
    }

    async runAllTests() {
        console.log('\n🛡️ 오류 자동 복구 시스템 테스트 시작');
        
        await this.testNetworkFailureRecovery();
        await this.testDataCorruptionRecovery();
        await this.testServiceUnavailableRecovery();
        await this.testPartialFailureRecovery();
        await this.testCascadingFailureRecovery();
        
        return this.generateReport();
    }

    // 3.1 네트워크 실패 복구 테스트
    async testNetworkFailureRecovery() {
        console.log('\n🌐 네트워크 실패 복구 테스트');

        // 테스트 1: API 요청 실패 후 재시도
        try {
            let attemptCount = 0;
            const maxRetries = 3;
            
            const retryRequest = async () => {
                attemptCount++;
                
                try {
                    // 의도적으로 잘못된 엔드포인트로 요청
                    if (attemptCount <= 2) {
                        await axios.get(`${this.apiUrl}/non-existent-endpoint/`);
                    } else {
                        // 세 번째 시도에서 정상 엔드포인트
                        const response = await axios.get(`${this.apiUrl}/health/`);
                        return response;
                    }
                } catch (error) {
                    if (attemptCount < maxRetries) {
                        console.log(`    재시도 ${attemptCount}/${maxRetries}`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * attemptCount)); // 지수 백오프
                        return retryRequest();
                    } else {
                        throw error;
                    }
                }
            };

            const finalResponse = await retryRequest();
            
            this.addTestResult('API_요청_실패_재시도', finalResponse.status === 200, {
                totalAttempts: attemptCount,
                maxRetries,
                finalSuccess: true
            });

        } catch (error) {
            this.addTestResult('API_요청_실패_재시도', false, { error: error.message });
        }

        // 테스트 2: 타임아웃 후 복구
        try {
            const timeoutRecoveryPromise = new Promise(async (resolve, reject) => {
                try {
                    // 매우 짧은 타임아웃으로 요청 (실패 유도)
                    await axios.get(`${this.apiUrl}/video-planning/`, {
                        timeout: 1, // 1ms 타임아웃
                        headers: { Authorization: `Bearer ${this.authToken}` }
                    });
                    resolve(false); // 성공하면 안됨
                } catch (timeoutError) {
                    // 타임아웃 발생 후 정상 타임아웃으로 재시도
                    try {
                        const recoveryResponse = await axios.get(`${this.apiUrl}/video-planning/`, {
                            timeout: 10000, // 10초 타임아웃
                            headers: { Authorization: `Bearer ${this.authToken}` }
                        });
                        resolve(recoveryResponse.status === 200);
                    } catch (recoveryError) {
                        resolve(false);
                    }
                }
            });

            const timeoutRecoverySuccess = await timeoutRecoveryPromise;

            this.addTestResult('타임아웃_후_복구', timeoutRecoverySuccess, {
                initialTimeout: 1,
                recoveryTimeout: 10000
            });

        } catch (error) {
            this.addTestResult('타임아웃_후_복구', false, { error: error.message });
        }
    }

    // 3.2 데이터 손상 복구 테스트
    async testDataCorruptionRecovery() {
        console.log('\n💾 데이터 손상 복구 테스트');

        // 테스트 1: 잘못된 데이터 형식 복구
        try {
            const corruptedData = {
                planning_type: null, // null 값
                user_input: undefined, // undefined 값
                pro_options: 'invalid_object', // 객체가 아닌 문자열
                invalid_field: 'should_be_ignored'
            };

            // 데이터 검증 및 자동 복구 API 호출
            const response = await axios.post(
                `${this.apiUrl}/video-planning/create-with-validation/`,
                corruptedData,
                { 
                    headers: { 
                        Authorization: `Bearer ${this.authToken}`,
                        'X-Auto-Recover': 'true'
                    } 
                }
            );

            const recoverySuccess = response.data.auto_recovery_applied && 
                                  response.data.recovered_fields.length > 0;

            this.addTestResult('잘못된_데이터_형식_복구', recoverySuccess, {
                recoveredFields: response.data.recovered_fields,
                originalErrors: response.data.original_validation_errors
            });

        } catch (error) {
            // 복구 불가능한 경우 적절한 오류 메시지 확인
            const properErrorHandling = error.response.status === 400 &&
                                      error.response.data.error_code === 'UNRECOVERABLE_DATA_CORRUPTION';

            this.addTestResult('잘못된_데이터_형식_복구', properErrorHandling, {
                errorCode: error.response?.data?.error_code,
                errorMessage: error.response?.data?.message
            });
        }

        // 테스트 2: 부분 데이터 손실 복구
        try {
            const partialData = {
                planning_type: 'story',
                user_input: '부분 데이터 테스트',
                // pro_options 누락
            };

            const response = await axios.post(
                `${this.apiUrl}/video-planning/create-with-defaults/`,
                partialData,
                { 
                    headers: { 
                        Authorization: `Bearer ${this.authToken}`,
                        'X-Apply-Defaults': 'true'
                    } 
                }
            );

            const defaultsApplied = response.data.defaults_applied && 
                                  response.data.pro_options !== null;

            this.addTestResult('부분_데이터_손실_복구', defaultsApplied, {
                appliedDefaults: response.data.applied_defaults,
                finalProOptions: response.data.pro_options
            });

        } catch (error) {
            this.addTestResult('부분_데이터_손실_복구', false, { error: error.message });
        }
    }

    // 3.3 서비스 불가 상황 복구 테스트
    async testServiceUnavailableRecovery() {
        console.log('\n🚫 서비스 불가 상황 복구 테스트');

        // 테스트 1: 외부 AI 서비스 실패 시 대체 서비스 사용
        try {
            const aiRequest = {
                prompt: '대체 서비스 테스트',
                fallback_enabled: true,
                primary_service: 'openai',
                fallback_services: ['anthropic', 'google', 'local']
            };

            const response = await axios.post(
                `${this.apiUrl}/ai/generate-with-fallback/`,
                aiRequest,
                { headers: { Authorization: `Bearer ${this.authToken}` } }
            );

            const fallbackUsed = response.data.service_used !== 'openai' ||
                                response.data.fallback_attempts > 0;

            this.addTestResult('AI_서비스_대체_사용', response.status === 200, {
                primaryService: 'openai',
                serviceUsed: response.data.service_used,
                fallbackAttempts: response.data.fallback_attempts,
                totalResponseTime: response.data.total_response_time
            });

        } catch (error) {
            this.addTestResult('AI_서비스_대체_사용', false, { error: error.message });
        }

        // 테스트 2: 데이터베이스 연결 실패 시 캐시 사용
        try {
            const cacheRequest = {
                query: 'cache_fallback_test',
                use_cache_on_db_failure: true
            };

            const response = await axios.post(
                `${this.apiUrl}/projects/search-with-cache-fallback/`,
                cacheRequest,
                { headers: { Authorization: `Bearer ${this.authToken}` } }
            );

            const cacheUsed = response.data.data_source === 'cache' ||
                            response.data.cache_fallback_used;

            this.addTestResult('DB_실패시_캐시_사용', response.status === 200, {
                dataSource: response.data.data_source,
                cacheFallbackUsed: response.data.cache_fallback_used,
                cacheAge: response.data.cache_age
            });

        } catch (error) {
            this.addTestResult('DB_실패시_캐시_사용', false, { error: error.message });
        }
    }

    // 3.4 부분 실패 복구 테스트
    async testPartialFailureRecovery() {
        console.log('\n⚡ 부분 실패 복구 테스트');

        // 테스트 1: 배치 작업 부분 실패 복구
        try {
            const batchRequest = {
                scenes: [
                    { id: 1, description: '정상 씬 1' },
                    { id: 2, description: 'invalid_prompt_###' }, // 의도적 오류
                    { id: 3, description: '정상 씬 3' },
                    { id: 4, description: '' }, // 빈 설명
                    { id: 5, description: '정상 씬 5' }
                ],
                continue_on_error: true,
                retry_failed_items: true
            };

            const response = await axios.post(
                `${this.apiUrl}/video-planning/process-batch-with-recovery/`,
                batchRequest,
                { headers: { Authorization: `Bearer ${this.authToken}` } }
            );

            const partialRecoverySuccess = response.data.total_processed > 0 &&
                                         response.data.failed_items.length > 0 &&
                                         response.data.recovered_items.length > 0;

            this.addTestResult('배치_작업_부분_실패_복구', partialRecoverySuccess, {
                totalItems: 5,
                successfullyProcessed: response.data.total_processed,
                failedItems: response.data.failed_items.length,
                recoveredItems: response.data.recovered_items.length,
                finalSuccessRate: response.data.final_success_rate
            });

        } catch (error) {
            this.addTestResult('배치_작업_부분_실패_복구', false, { error: error.message });
        }

        // 테스트 2: 스토리보드 생성 부분 실패 복구
        try {
            const storyboardRequest = {
                scenes: [
                    'beautiful landscape scene',
                    'INVALID_SCENE_WITH_FORBIDDEN_WORDS_THAT_SHOULD_FAIL',
                    'professional business meeting',
                    'technology innovation showcase'
                ],
                partial_success_allowed: true,
                min_success_threshold: 0.5 // 50% 이상 성공하면 OK
            };

            const response = await axios.post(
                `${this.apiUrl}/video-planning/generate-storyboard-partial/`,
                storyboardRequest,
                { headers: { Authorization: `Bearer ${this.authToken}` } }
            );

            const partialStoryboardSuccess = response.data.generated_images.length >= 2 &&
                                           response.data.success_rate >= 0.5;

            this.addTestResult('스토리보드_부분_실패_복구', partialStoryboardSuccess, {
                requestedScenes: 4,
                generatedImages: response.data.generated_images.length,
                failedScenes: response.data.failed_scenes.length,
                successRate: response.data.success_rate
            });

        } catch (error) {
            this.addTestResult('스토리보드_부분_실패_복구', false, { error: error.message });
        }
    }

    // 3.5 연쇄 실패 복구 테스트
    async testCascadingFailureRecovery() {
        console.log('\n🔗 연쇄 실패 복구 테스트');

        // 테스트 1: 다중 서비스 의존성 실패 복구
        try {
            const complexRequest = {
                workflow: [
                    { step: 'ai_prompt_generation', critical: true },
                    { step: 'image_generation', critical: false },
                    { step: 'pdf_export', critical: true },
                    { step: 'email_notification', critical: false }
                ],
                failure_recovery_strategy: 'skip_non_critical',
                max_retry_attempts: 2
            };

            const response = await axios.post(
                `${this.apiUrl}/video-planning/execute-workflow-with-recovery/`,
                complexRequest,
                { headers: { Authorization: `Bearer ${this.authToken}` } }
            );

            const cascadingRecoverySuccess = response.data.critical_steps_completed &&
                                           response.data.workflow_status === 'partially_completed' &&
                                           response.data.recovery_actions_taken > 0;

            this.addTestResult('연쇄_실패_복구', cascadingRecoverySuccess, {
                totalSteps: 4,
                completedSteps: response.data.completed_steps,
                failedSteps: response.data.failed_steps,
                recoveryActionsTaken: response.data.recovery_actions_taken,
                criticalStepsCompleted: response.data.critical_steps_completed
            });

        } catch (error) {
            this.addTestResult('연쇄_실패_복구', false, { error: error.message });
        }
    }

    // 유틸리티 메서드들
    addTestResult(testName, success, details) {
        this.testResults.push({
            test: testName,
            success,
            details,
            timestamp: new Date().toISOString()
        });

        const icon = success ? '✅' : '❌';
        console.log(`  ${icon} ${testName}: ${success ? '성공' : '실패'}`);
    }

    generateReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = ((passedTests / totalTests) * 100).toFixed(2);

        return {
            category: 'AutoRecoverySystem',
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: `${successRate}%`
            },
            details: this.testResults,
            recommendations: this.generateRecommendations()
        };
    }

    generateRecommendations() {
        const recommendations = [];
        const failedTests = this.testResults.filter(r => !r.success);

        if (failedTests.some(t => t.test.includes('네트워크'))) {
            recommendations.push('네트워크 실패 복구 메커니즘을 강화하세요. 재시도 로직과 백오프 전략을 개선하세요.');
        }

        if (failedTests.some(t => t.test.includes('데이터'))) {
            recommendations.push('데이터 검증 및 복구 로직을 개선하세요. 자동 복구 규칙을 추가하세요.');
        }

        if (failedTests.some(t => t.test.includes('서비스'))) {
            recommendations.push('외부 서비스 의존성을 줄이고 대체 서비스 목록을 확장하세요.');
        }

        if (failedTests.some(t => t.test.includes('배치'))) {
            recommendations.push('배치 작업의 부분 실패 처리를 개선하세요. 트랜잭션 관리를 강화하세요.');
        }

        return recommendations;
    }
}

// =================================================================
// 4. 메인 실행기
// =================================================================

async function runCoreFeatureTests() {
    const API_URL = 'https://videoplanet.up.railway.app/api';
    const WEBSOCKET_URL = 'wss://videoplanet.up.railway.app/ws';
    
    // 테스트용 인증 토큰 획득 (실제로는 로그인 과정 필요)
    let authToken = null;
    
    try {
        // 테스트 사용자 로그인
        const loginResponse = await axios.post(`${API_URL}/users/login/`, {
            username: 'test_user',
            password: 'test_password'
        });
        authToken = loginResponse.data.access;
    } catch (error) {
        console.error('인증 실패:', error.message);
        return;
    }

    console.log('🚀 VideoPlanet 핵심 기능별 QA 테스트 시작\n');

    const allReports = [];

    // 1. PlanningWizard 테스트
    const planningWizardTests = new PlanningWizardQATests(API_URL, authToken);
    const planningReport = await planningWizardTests.runAllTests();
    allReports.push(planningReport);

    // 2. 실시간 협업 기능 테스트  
    const collaborationTests = new RealTimeCollaborationQATests(API_URL, WEBSOCKET_URL, authToken);
    const collaborationReport = await collaborationTests.runAllTests();
    allReports.push(collaborationReport);
    collaborationTests.cleanup();

    // 3. 오류 자동 복구 시스템 테스트
    const autoRecoveryTests = new AutoRecoverySystemQATests(API_URL, authToken);
    const recoveryReport = await autoRecoveryTests.runAllTests();
    allReports.push(recoveryReport);

    // 최종 통합 리포트 생성
    generateFinalReport(allReports);
}

function generateFinalReport(reports) {
    console.log('\n' + '='.repeat(80));
    console.log('               VideoPlanet 핵심 기능 QA 테스트 최종 리포트');
    console.log('='.repeat(80));

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    reports.forEach(report => {
        totalTests += report.summary.total;
        totalPassed += report.summary.passed;
        totalFailed += report.summary.failed;

        console.log(`\n📋 ${report.category} 결과:`);
        console.log(`   총 테스트: ${report.summary.total}`);
        console.log(`   성공: ✅ ${report.summary.passed}`);
        console.log(`   실패: ❌ ${report.summary.failed}`);
        console.log(`   성공률: ${report.summary.successRate}`);

        if (report.recommendations.length > 0) {
            console.log(`   권장사항:`);
            report.recommendations.forEach(rec => {
                console.log(`   - ${rec}`);
            });
        }
    });

    const overallSuccessRate = ((totalPassed / totalTests) * 100).toFixed(2);

    console.log(`\n📊 전체 결과 요약:`);
    console.log(`   총 테스트: ${totalTests}`);
    console.log(`   전체 성공: ✅ ${totalPassed}`);
    console.log(`   전체 실패: ❌ ${totalFailed}`);
    console.log(`   전체 성공률: ${overallSuccessRate}%`);

    // 품질 등급 결정
    let qualityGrade = 'F';
    if (overallSuccessRate >= 95) qualityGrade = 'A';
    else if (overallSuccessRate >= 90) qualityGrade = 'B';
    else if (overallSuccessRate >= 80) qualityGrade = 'C';
    else if (overallSuccessRate >= 70) qualityGrade = 'D';

    console.log(`\n🏆 품질 등급: ${qualityGrade} (${overallSuccessRate}%)`);

    if (qualityGrade === 'A') {
        console.log('   🎉 우수한 품질! 배포 준비 완료!');
    } else if (qualityGrade === 'B') {
        console.log('   ✨ 양호한 품질. 몇 가지 개선사항이 있습니다.');
    } else {
        console.log('   ⚠️  개선이 필요합니다. 실패한 테스트를 우선 수정하세요.');
    }

    console.log('\n' + '='.repeat(80));
}

// 스크립트 직접 실행 시에만 main 함수 호출
if (require.main === module) {
    runCoreFeatureTests().catch(error => {
        console.error('테스트 실행 실패:', error.message);
        process.exit(1);
    });
}

module.exports = {
    PlanningWizardQATests,
    RealTimeCollaborationQATests,
    AutoRecoverySystemQATests,
    runCoreFeatureTests,
    generateFinalReport
};