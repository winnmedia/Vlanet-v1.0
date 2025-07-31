/**
 * VideoPlanet 사용자 여정 테스트 #4: 비디오 기획 (AI)
 * 우선순위: 중간 (AI 기능 특화)
 */

const axios = require('axios');

class AIVideoPlanningJourneyTest {
    constructor() {
        this.baseURL = 'https://videoplanet.up.railway.app';
        this.authToken = null;
        this.testProject = null;
        this.createdPlans = [];
        this.testResults = {
            journey: 'AI Video Planning',
            scenarios: [],
            totalTests: 0,
            passedTests: 0,
            criticalIssues: [],
            aiPerformanceMetrics: []
        };
    }

    async runJourney() {
        console.log('🚀 Journey 4: 비디오 기획 (AI) 테스트 시작');
        
        // 사전 조건: 인증 및 테스트 프로젝트 준비
        await this.setupTestEnvironment();
        
        if (!this.authToken) {
            console.log('❌ 인증 실패로 테스트 중단');
            return;
        }

        // 시나리오 1: AI 기반 콘티 생성
        await this.testAIStoryboardGeneration();
        
        // 시나리오 2: 영상 분석 및 최적화 제안
        await this.testVideoAnalysisAndOptimization();
        
        // 시나리오 3: 자동 키워드 추출 및 태그 생성
        await this.testAutomaticKeywordExtraction();
        
        // 시나리오 4: AI 기반 촬영 계획 생성
        await this.testAIShootingPlanGeneration();
        
        // 시나리오 5: 음성/자막 자동 생성
        await this.testAutomaticTranscriptionAndSubtitles();
        
        // 시나리오 6: AI 품질 평가 및 개선 제안
        await this.testAIQualityAssessment();
        
        // 시나리오 7: 개인화된 컨텐츠 추천
        await this.testPersonalizedContentRecommendation();
        
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

        // 테스트 프로젝트 생성 (AI 기능용)
        try {
            const projectData = {
                name: `AI 기획 테스트 프로젝트 ${Date.now()}`,
                type: 'marketing',
                client: 'AI 테스트 클라이언트',
                description: '인공지능 기반 영상 제작을 위한 테스트 프로젝트',
                budget: 5000000,
                ai_features_enabled: true
            };

            const projectResponse = await axios.post(
                `${this.baseURL}/api/projects/`,
                projectData,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            );

            this.testProject = projectResponse.data;
            console.log('✅ AI 테스트 프로젝트 생성 성공:', this.testProject.id);
        } catch (error) {
            console.log('❌ AI 테스트 프로젝트 생성 실패:', error.message);
        }
    }

    async testAIStoryboardGeneration() {
        const scenario = {
            name: 'AI 기반 콘티 생성',
            tests: [],
            criticalLevel: 'HIGH'
        };

        const storyboardRequests = [
            {
                type: 'marketing_video',
                prompt: '신제품 런칭을 위한 30초 마케팅 영상 콘티를 생성해주세요. 젊은 층을 타겟으로 하는 활기찬 분위기를 원합니다.',
                duration: 30,
                target_audience: 'young_adults',
                style: 'energetic'
            },
            {
                type: 'educational_content',
                prompt: '프로그래밍 기초를 설명하는 5분 교육 영상의 콘티를 만들어주세요. 초보자도 이해하기 쉽게 구성해주세요.',
                duration: 300,
                target_audience: 'beginners',
                style: 'educational'
            }
        ];

        for (const request of storyboardRequests) {
            try {
                const startTime = Date.now();
                
                const aiData = {
                    project: this.testProject.id,
                    ...request
                };

                const response = await axios.post(
                    `${this.baseURL}/api/ai/storyboard/generate/`,
                    aiData,
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` },
                        timeout: 30000 // AI 처리는 시간이 오래 걸릴 수 있음
                    }
                );

                const responseTime = Date.now() - startTime;

                if (response.status === 201 || response.status === 200) {
                    const storyboard = response.data;
                    this.createdPlans.push(storyboard);
                    
                    scenario.tests.push({
                        name: `AI 콘티 생성: ${request.type}`,
                        status: 'PASS',
                        details: `콘티 ID: ${storyboard.id}, 씬 수: ${storyboard.scenes?.length || 'N/A'}`,
                        performanceMs: responseTime
                    });

                    this.testResults.aiPerformanceMetrics.push({
                        operation: 'storyboard_generation',
                        type: request.type,
                        responseTime: responseTime,
                        prompt_length: request.prompt.length,
                        output_quality: this.assessStoryboardQuality(storyboard)
                    });

                    // AI 생성 결과 품질 평가
                    await this.validateAIStoryboardQuality(scenario, storyboard, request.type);

                } else {
                    scenario.tests.push({
                        name: `AI 콘티 생성: ${request.type}`,
                        status: 'FAIL',
                        details: `예상치 못한 상태 코드: ${response.status}`
                    });
                }

            } catch (error) {
                scenario.tests.push({
                    name: `AI 콘티 생성: ${request.type}`,
                    status: 'FAIL',
                    details: `오류: ${error.response?.data?.message || error.message}`,
                    severity: error.code === 'ECONNABORTED' ? 'HIGH' : 'MEDIUM'
                });

                if (error.code === 'ECONNABORTED') {
                    this.testResults.criticalIssues.push({
                        issue: 'AI 콘티 생성 타임아웃',
                        impact: 'AI 기능 사용 불가',
                        urgency: 'HIGH'
                    });
                }
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async validateAIStoryboardQuality(scenario, storyboard, type) {
        // AI 생성 콘티의 품질 검증
        const qualityChecks = [
            {
                name: '씬 구성 완성도',
                check: storyboard.scenes && storyboard.scenes.length > 0,
                details: `${storyboard.scenes?.length || 0}개 씬 생성됨`
            },
            {
                name: '타임라인 일관성',
                check: this.validateTimeline(storyboard.scenes),
                details: '타임라인 검증 완료'
            },
            {
                name: '콘텐츠 적합성',
                check: this.validateContentAppropriate(storyboard, type),
                details: '콘텐츠 적합성 확인됨'
            }
        ];

        qualityChecks.forEach(check => {
            scenario.tests.push({
                name: `품질 검증: ${check.name}`,
                status: check.check ? 'PASS' : 'FAIL',
                details: check.details
            });
        });
    }

    validateTimeline(scenes) {
        if (!scenes || scenes.length === 0) return false;
        
        let totalTime = 0;
        for (const scene of scenes) {
            if (!scene.duration || scene.duration <= 0) return false;
            totalTime += scene.duration;
        }
        
        return totalTime > 0;
    }

    validateContentAppropriate(storyboard, type) {
        // 간단한 콘텐츠 적합성 검증
        if (!storyboard.scenes || storyboard.scenes.length === 0) return false;
        
        // 타입별 기본 검증
        switch (type) {
            case 'marketing_video':
                return storyboard.scenes.some(scene => 
                    scene.description && (
                        scene.description.includes('제품') || 
                        scene.description.includes('브랜드')
                    )
                );
            case 'educational_content':
                return storyboard.scenes.some(scene => 
                    scene.description && (
                        scene.description.includes('설명') || 
                        scene.description.includes('학습')
                    )
                );
            default:
                return true;
        }
    }

    assessStoryboardQuality(storyboard) {
        // AI 생성 품질을 수치로 평가 (1-10)
        let score = 5; // 기본 점수
        
        if (storyboard.scenes && storyboard.scenes.length > 0) {
            score += 2;
            
            // 각 씬이 적절한 설명을 가지고 있는지
            const scenesWithDescription = storyboard.scenes.filter(scene => 
                scene.description && scene.description.length > 10
            ).length;
            
            score += (scenesWithDescription / storyboard.scenes.length) * 2;
            
            // 타임라인이 있는지
            if (this.validateTimeline(storyboard.scenes)) {
                score += 1;
            }
        }
        
        return Math.min(10, Math.max(1, Math.round(score)));
    }

    async testVideoAnalysisAndOptimization() {
        const scenario = {
            name: '영상 분석 및 최적화 제안',
            tests: [],
            criticalLevel: 'HIGH'
        };

        const videoAnalysisRequests = [
            {
                video_url: 'https://example.com/sample-video-1.mp4',
                analysis_type: 'quality_assessment',
                optimization_target: 'engagement'
            },
            {
                video_url: 'https://example.com/sample-video-2.mp4',
                analysis_type: 'content_analysis',
                optimization_target: 'accessibility'
            }
        ];

        for (const request of videoAnalysisRequests) {
            try {
                const startTime = Date.now();
                
                const response = await axios.post(
                    `${this.baseURL}/api/ai/video/analyze/`,
                    {
                        project: this.testProject.id,
                        ...request
                    },
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` },
                        timeout: 45000 // 영상 분석은 더 오래 걸릴 수 있음
                    }
                );

                const responseTime = Date.now() - startTime;

                if (response.status === 200 || response.status === 201) {
                    const analysis = response.data;
                    
                    scenario.tests.push({
                        name: `영상 분석: ${request.analysis_type}`,
                        status: 'PASS',
                        details: `분석 완료, 점수: ${analysis.overall_score || 'N/A'}`,
                        performanceMs: responseTime
                    });

                    // 최적화 제안 품질 확인
                    if (analysis.optimization_suggestions && analysis.optimization_suggestions.length > 0) {
                        scenario.tests.push({
                            name: `최적화 제안: ${request.optimization_target}`,
                            status: 'PASS',
                            details: `${analysis.optimization_suggestions.length}개 제안사항`
                        });
                    } else {
                        scenario.tests.push({
                            name: `최적화 제안: ${request.optimization_target}`,
                            status: 'FAIL',
                            details: '최적화 제안사항 없음'
                        });
                    }

                    this.testResults.aiPerformanceMetrics.push({
                        operation: 'video_analysis',
                        type: request.analysis_type,
                        responseTime: responseTime,
                        analysis_quality: analysis.overall_score || 0
                    });

                } else {
                    scenario.tests.push({
                        name: `영상 분석: ${request.analysis_type}`,
                        status: 'FAIL',
                        details: `상태 코드: ${response.status}`
                    });
                }

            } catch (error) {
                scenario.tests.push({
                    name: `영상 분석: ${request.analysis_type}`,
                    status: 'FAIL',
                    details: `오류: ${error.response?.data?.message || error.message}`,
                    severity: 'HIGH'
                });

                if (error.response?.status === 503) {
                    this.testResults.criticalIssues.push({
                        issue: 'AI 영상 분석 서비스 장애',
                        impact: 'AI 기반 영상 최적화 불가',
                        urgency: 'HIGH'
                    });
                }
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testAutomaticKeywordExtraction() {
        const scenario = {
            name: '자동 키워드 추출 및 태그 생성',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        const keywordExtractionRequests = [
            {
                content_type: 'video_description',
                text: '이 영상은 최신 스마트폰의 카메라 기능을 리뷰하는 내용입니다. 야간 촬영, 포트레이트 모드, 광각 렌즈 등 다양한 기능을 테스트해보겠습니다.',
                language: 'ko'
            },
            {
                content_type: 'script',
                text: 'Welcome to our comprehensive guide on machine learning basics. Today we will cover neural networks, deep learning, and practical applications in business.',
                language: 'en'
            }
        ];

        for (const request of keywordExtractionRequests) {
            try {
                const response = await axios.post(
                    `${this.baseURL}/api/ai/keywords/extract/`,
                    {
                        project: this.testProject.id,
                        ...request
                    },
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` },
                        timeout: 15000
                    }
                );

                if (response.status === 200) {
                    const keywords = response.data;
                    
                    scenario.tests.push({
                        name: `키워드 추출: ${request.language}`,
                        status: keywords.keywords && keywords.keywords.length > 0 ? 'PASS' : 'FAIL',
                        details: `${keywords.keywords?.length || 0}개 키워드 추출`
                    });

                    // 키워드 품질 평가
                    if (keywords.keywords && keywords.keywords.length > 0) {
                        const relevantKeywords = this.evaluateKeywordRelevance(keywords.keywords, request.text);
                        
                        scenario.tests.push({
                            name: `키워드 관련성: ${request.language}`,
                            status: relevantKeywords > 0.7 ? 'PASS' : 'PARTIAL',
                            details: `관련성 점수: ${(relevantKeywords * 100).toFixed(1)}%`
                        });
                    }

                    // 자동 태그 생성 테스트
                    if (keywords.suggested_tags) {
                        scenario.tests.push({
                            name: `자동 태그 생성: ${request.language}`,
                            status: 'PASS',
                            details: `${keywords.suggested_tags.length}개 태그 생성됨`
                        });
                    }

                } else {
                    scenario.tests.push({
                        name: `키워드 추출: ${request.language}`,
                        status: 'FAIL',
                        details: `상태 코드: ${response.status}`
                    });
                }

            } catch (error) {
                scenario.tests.push({
                    name: `키워드 추출: ${request.language}`,
                    status: 'FAIL',
                    details: `오류: ${error.message}`
                });
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    evaluateKeywordRelevance(keywords, originalText) {
        // 간단한 키워드 관련성 평가
        if (!keywords || keywords.length === 0) return 0;
        
        const textLower = originalText.toLowerCase();
        const relevantCount = keywords.filter(keyword => {
            const keywordLower = keyword.toLowerCase();
            return textLower.includes(keywordLower) || 
                   this.isSemanticallyRelated(keywordLower, textLower);
        }).length;
        
        return relevantCount / keywords.length;
    }

    isSemanticallyRelated(keyword, text) {
        // 간단한 의미적 관련성 검사 (실제로는 더 복잡한 NLP 모델 사용)
        const relatedTerms = {
            '스마트폰': ['폰', '모바일', '디바이스', '핸드폰'],
            '카메라': ['촬영', '사진', '영상', '렌즈'],
            'machine learning': ['ai', 'artificial intelligence', 'ml', 'algorithm'],
            'neural networks': ['deep learning', 'neural', 'network', 'ai']
        };
        
        for (const [mainTerm, related] of Object.entries(relatedTerms)) {
            if (keyword.includes(mainTerm) || related.some(term => keyword.includes(term))) {
                return related.some(term => text.includes(term)) || text.includes(mainTerm);
            }
        }
        
        return false;
    }

    async testAIShootingPlanGeneration() {
        const scenario = {
            name: 'AI 기반 촬영 계획 생성',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        const shootingPlanRequests = [
            {
                project_type: 'commercial',
                duration: 60,
                budget: 10000000,
                location_preference: 'indoor',
                crew_size: 'medium'
            },
            {
                project_type: 'documentary',
                duration: 1800, // 30분
                budget: 5000000,
                location_preference: 'outdoor',
                crew_size: 'small'
            }
        ];

        for (const request of shootingPlanRequests) {
            try {
                const response = await axios.post(
                    `${this.baseURL}/api/ai/shooting-plan/generate/`,
                    {
                        project: this.testProject.id,
                        ...request
                    },
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` },
                        timeout: 20000
                    }
                );

                if (response.status === 200 || response.status === 201) {
                    const plan = response.data;
                    
                    scenario.tests.push({
                        name: `촬영 계획: ${request.project_type}`,
                        status: 'PASS',
                        details: `일정: ${plan.schedule_days || 'N/A'}일, 장소: ${plan.locations?.length || 0}개`
                    });

                    // 촬영 계획 구성 요소 검증
                    const planComponents = [
                        { name: '촬영 일정', check: plan.schedule && plan.schedule.length > 0 },
                        { name: '필요 장비', check: plan.equipment && plan.equipment.length > 0 },
                        { name: '예산 분배', check: plan.budget_breakdown && Object.keys(plan.budget_breakdown).length > 0 },
                        { name: '촬영 위치', check: plan.locations && plan.locations.length > 0 }
                    ];

                    planComponents.forEach(component => {
                        scenario.tests.push({
                            name: `계획 구성: ${component.name}`,
                            status: component.check ? 'PASS' : 'FAIL',
                            details: component.check ? '구성 완료' : '구성 누락'
                        });
                    });

                } else {
                    scenario.tests.push({
                        name: `촬영 계획: ${request.project_type}`,
                        status: 'FAIL',
                        details: `상태 코드: ${response.status}`
                    });
                }

            } catch (error) {
                scenario.tests.push({
                    name: `촬영 계획: ${request.project_type}`,
                    status: 'FAIL',
                    details: `오류: ${error.message}`
                });
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testAutomaticTranscriptionAndSubtitles() {
        const scenario = {
            name: '음성/자막 자동 생성',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        const transcriptionRequests = [
            {
                audio_url: 'https://example.com/sample-audio-korean.mp3',
                language: 'ko',
                output_format: 'srt'
            },
            {
                video_url: 'https://example.com/sample-video-english.mp4',
                language: 'en',
                output_format: 'vtt',
                include_speaker_identification: true
            }
        ];

        for (const request of transcriptionRequests) {
            try {
                const response = await axios.post(
                    `${this.baseURL}/api/ai/transcription/`,
                    {
                        project: this.testProject.id,
                        ...request
                    },
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` },
                        timeout: 60000 // 음성 인식은 시간이 오래 걸림
                    }
                );

                if (response.status === 200 || response.status === 201) {
                    const transcription = response.data;
                    
                    scenario.tests.push({
                        name: `음성 인식: ${request.language}`,
                        status: 'PASS',
                        details: `텍스트 길이: ${transcription.text?.length || 0}자`
                    });

                    // 자막 파일 생성 확인
                    if (transcription.subtitle_file_url) {
                        scenario.tests.push({
                            name: `자막 파일 생성: ${request.output_format}`,
                            status: 'PASS',
                            details: `자막 파일 URL 생성됨`
                        });

                        // 자막 파일 접근성 테스트
                        try {
                            const subtitleResponse = await axios.head(transcription.subtitle_file_url, { timeout: 5000 });
                            
                            scenario.tests.push({
                                name: `자막 파일 접근성: ${request.output_format}`,
                                status: subtitleResponse.status === 200 ? 'PASS' : 'FAIL',
                                details: `HTTP 상태: ${subtitleResponse.status}`
                            });
                        } catch (error) {
                            scenario.tests.push({
                                name: `자막 파일 접근성: ${request.output_format}`,
                                status: 'FAIL',
                                details: `접근 실패: ${error.message}`
                            });
                        }
                    }

                    // 화자 식별 기능 테스트
                    if (request.include_speaker_identification && transcription.speakers) {
                        scenario.tests.push({
                            name: '화자 식별 기능',
                            status: 'PASS',
                            details: `${transcription.speakers.length}명 화자 식별됨`
                        });
                    }

                } else {
                    scenario.tests.push({
                        name: `음성 인식: ${request.language}`,
                        status: 'FAIL',
                        details: `상태 코드: ${response.status}`
                    });
                }

            } catch (error) {
                scenario.tests.push({
                    name: `음성 인식: ${request.language}`,
                    status: 'FAIL',
                    details: `오류: ${error.message}`,
                    severity: error.code === 'ECONNABORTED' ? 'HIGH' : 'MEDIUM'
                });
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testAIQualityAssessment() {
        const scenario = {
            name: 'AI 품질 평가 및 개선 제안',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        const qualityAssessmentRequests = [
            {
                video_url: 'https://example.com/test-video-quality-1.mp4',
                assessment_criteria: ['visual_quality', 'audio_quality', 'content_flow'],
                target_platform: 'youtube'
            },
            {
                video_url: 'https://example.com/test-video-quality-2.mp4',
                assessment_criteria: ['engagement', 'accessibility', 'brand_consistency'],
                target_platform: 'instagram'
            }
        ];

        for (const request of qualityAssessmentRequests) {
            try {
                const response = await axios.post(
                    `${this.baseURL}/api/ai/quality/assess/`,
                    {
                        project: this.testProject.id,
                        ...request
                    },
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` },
                        timeout: 30000
                    }
                );

                if (response.status === 200) {
                    const assessment = response.data;
                    
                    scenario.tests.push({
                        name: `품질 평가: ${request.target_platform}`,
                        status: 'PASS',
                        details: `종합 점수: ${assessment.overall_score || 'N/A'}/100`
                    });

                    // 개별 기준별 평가 확인
                    if (assessment.criteria_scores) {
                        request.assessment_criteria.forEach(criterion => {
                            const score = assessment.criteria_scores[criterion];
                            scenario.tests.push({
                                name: `기준별 평가: ${criterion}`,
                                status: score >= 70 ? 'PASS' : 'PARTIAL',
                                details: `점수: ${score || 'N/A'}/100`
                            });
                        });
                    }

                    // 개선 제안사항 확인
                    if (assessment.improvement_suggestions && assessment.improvement_suggestions.length > 0) {
                        scenario.tests.push({
                            name: `개선 제안: ${request.target_platform}`,
                            status: 'PASS',
                            details: `${assessment.improvement_suggestions.length}개 제안사항`
                        });

                        // 제안사항의 실행 가능성 평가
                        const actionableSuggestions = assessment.improvement_suggestions.filter(
                            suggestion => suggestion.feasibility && suggestion.feasibility >= 70
                        );

                        scenario.tests.push({
                            name: '실행 가능한 제안',
                            status: actionableSuggestions.length > 0 ? 'PASS' : 'PARTIAL',
                            details: `${actionableSuggestions.length}개 실행 가능한 제안`
                        });
                    }

                } else {
                    scenario.tests.push({
                        name: `품질 평가: ${request.target_platform}`,
                        status: 'FAIL',
                        details: `상태 코드: ${response.status}`
                    });
                }

            } catch (error) {
                scenario.tests.push({
                    name: `품질 평가: ${request.target_platform}`,
                    status: 'FAIL',
                    details: `오류: ${error.message}`
                });
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testPersonalizedContentRecommendation() {
        const scenario = {
            name: '개인화된 컨텐츠 추천',
            tests: [],
            criticalLevel: 'LOW'
        };

        try {
            // 사용자 선호도 기반 추천
            const recommendationResponse = await axios.get(
                `${this.baseURL}/api/ai/recommendations/content/`,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` },
                    params: {
                        user_preferences: 'marketing,technology,education',
                        content_type: 'video_template',
                        limit: 10
                    }
                }
            );

            if (recommendationResponse.status === 200) {
                const recommendations = recommendationResponse.data;
                
                scenario.tests.push({
                    name: '개인화 컨텐츠 추천',
                    status: 'PASS',
                    details: `${recommendations.length}개 추천 항목`
                });

                // 추천 품질 평가
                if (recommendations.length > 0) {
                    const relevantRecommendations = recommendations.filter(
                        rec => rec.relevance_score && rec.relevance_score >= 70
                    );

                    scenario.tests.push({
                        name: '추천 관련성',
                        status: relevantRecommendations.length > 0 ? 'PASS' : 'PARTIAL',
                        details: `${relevantRecommendations.length}개 관련성 높은 추천`
                    });
                }

                // 다양성 평가
                const uniqueCategories = new Set(recommendations.map(rec => rec.category)).size;
                
                scenario.tests.push({
                    name: '추천 다양성',
                    status: uniqueCategories >= 3 ? 'PASS' : 'PARTIAL',
                    details: `${uniqueCategories}개 카테고리 추천`
                });

            } else {
                scenario.tests.push({
                    name: '개인화 컨텐츠 추천',
                    status: 'FAIL',
                    details: `상태 코드: ${recommendationResponse.status}`
                });
            }

            // 트렌드 기반 추천
            const trendResponse = await axios.get(
                `${this.baseURL}/api/ai/recommendations/trending/`,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` },
                    params: {
                        timeframe: '7days',
                        category: 'all'
                    }
                }
            );

            scenario.tests.push({
                name: '트렌드 기반 추천',
                status: trendResponse.status === 200 ? 'PASS' : 'FAIL',
                details: trendResponse.status === 200 ? 
                    `${trendResponse.data.length}개 트렌드 항목` : 
                    `상태: ${trendResponse.status}`
            });

        } catch (error) {
            scenario.tests.push({
                name: '컨텐츠 추천 시스템',
                status: 'FAIL',
                details: `오류: ${error.message}`
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async cleanup() {
        console.log('🧹 AI 테스트 정리 작업 시작...');
        
        // 생성된 AI 계획들 정리
        for (const plan of this.createdPlans) {
            try {
                await axios.delete(
                    `${this.baseURL}/api/ai/plans/${plan.id}/`,
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` }
                    }
                );
                console.log(`✅ AI 계획 ${plan.id} 정리 완료`);
            } catch (error) {
                console.log(`⚠️ AI 계획 ${plan.id} 정리 실패:`, error.message);
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
                console.log(`✅ AI 테스트 프로젝트 ${this.testProject.id} 정리 완료`);
            } catch (error) {
                console.log(`⚠️ AI 테스트 프로젝트 정리 실패:`, error.message);
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

        console.log('\n=== Journey 4: 비디오 기획 (AI) 테스트 결과 ===');
        console.log(`총 테스트: ${this.testResults.totalTests}개`);
        console.log(`성공: ${this.testResults.passedTests}개`);
        console.log(`성공률: ${successRate}%`);

        // AI 성능 메트릭 요약
        if (this.testResults.aiPerformanceMetrics.length > 0) {
            const avgResponseTime = this.testResults.aiPerformanceMetrics
                .reduce((sum, metric) => sum + metric.responseTime, 0) / this.testResults.aiPerformanceMetrics.length;
            
            const avgQuality = this.testResults.aiPerformanceMetrics
                .filter(m => m.output_quality || m.analysis_quality)
                .reduce((sum, metric) => sum + (metric.output_quality || metric.analysis_quality), 0) / 
                this.testResults.aiPerformanceMetrics.filter(m => m.output_quality || m.analysis_quality).length;
            
            console.log(`AI 평균 응답 시간: ${avgResponseTime.toFixed(0)}ms`);
            console.log(`AI 출력 품질 평균: ${avgQuality?.toFixed(1) || 'N/A'}/10`);
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
                           test.status === 'PARTIAL' ? '🔄' : 
                           test.status === 'FAIL' ? '❌' : '⏸️';
                const performance = test.performanceMs ? ` (${test.performanceMs}ms)` : '';
                console.log(`  ${icon} ${test.name}: ${test.details}${performance}`);
            });
        });

        return this.testResults;
    }
}

// 모듈로 export
module.exports = AIVideoPlanningJourneyTest;

// 직접 실행 시
if (require.main === module) {
    const journey = new AIVideoPlanningJourneyTest();
    journey.runJourney().then(() => {
        console.log('\n🎉 Journey 4 테스트 완료!');
    }).catch(error => {
        console.error('❌ Journey 4 테스트 실행 중 오류:', error.message);
    });
}