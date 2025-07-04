const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

// 로그인하여 토큰 받기
async function login() {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/users/login/`, {
            email: 'test1@test.com',
            password: 'Test1234!@'
        });
        return response.data.token;
    } catch (error) {
        console.error('로그인 실패:', error.response?.data || error.message);
        return null;
    }
}

// 스토리보드 생성 테스트
async function testStoryboardGeneration(token) {
    const shotData = {
        shot_number: 1,
        shot_type: "클로즈업",
        description: "사무실에서 노트북을 보며 웃고 있는 젊은 여성",
        camera_angle: "아이레벨",
        camera_movement: "고정",
        duration: "3초"
    };

    try {
        console.log('\n=== 스토리보드 생성 테스트 ===');
        console.log('요청 데이터:', JSON.stringify(shotData, null, 2));
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await axios.post(
            `${API_BASE_URL}/api/video-planning/generate/storyboards/`,
            { shot_data: shotData },
            { headers }
        );

        console.log('\n응답 상태:', response.status);
        console.log('응답 데이터:', JSON.stringify(response.data, null, 2));
        
        // 이미지 URL 확인
        if (response.data.data && response.data.data.storyboards) {
            const storyboards = response.data.data.storyboards;
            storyboards.forEach((board, index) => {
                console.log(`\n=== 스토리보드 ${index + 1} ===`);
                console.log('프레임 번호:', board.frame_number);
                console.log('제목:', board.title);
                console.log('설명:', board.visual_description);
                console.log('이미지 URL 존재:', !!board.image_url);
                
                if (board.image_url) {
                    console.log('이미지 URL 타입:', typeof board.image_url);
                    console.log('Base64 이미지인가?:', board.image_url.startsWith('data:image'));
                    console.log('URL 첫 100자:', board.image_url.substring(0, 100) + '...');
                    console.log('모델 사용:', board.model_used || 'unknown');
                    console.log('플레이스홀더인가?:', board.is_placeholder || false);
                }
            });
        }
        
        return response.data;
    } catch (error) {
        console.error('\n스토리보드 생성 실패:', error.response?.data || error.message);
        if (error.response?.data?.error) {
            console.error('상세 오류:', error.response.data.error);
        }
        return null;
    }
}

// 메인 실행
async function main() {
    console.log('VideoPlanet 스토리보드 이미지 테스트');
    console.log('=====================================\n');

    // 1. 인증 없이 테스트 (AllowAny 권한)
    console.log('1. 스토리보드 생성 테스트 (인증 없이)...');
    
    // 2. 스토리보드 생성 테스트
    await testStoryboardGeneration(null);
}

main();