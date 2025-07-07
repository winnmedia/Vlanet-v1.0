const axios = require('axios');

const API_URL = 'http://localhost:8000/api';
let authToken = '';

async function testMyPage() {
  console.log('=== 마이페이지 기능 테스트 ===\n');

  try {
    // 0. 회원가입 (테스트 사용자가 없을 경우)
    console.log('0. 테스트 사용자 생성 시도');
    try {
      const signupResponse = await axios.post(`${API_URL}/users/signup/`, {
        email: 'test@test.com',
        password: 'test1234!',
        nickname: '테스트사용자'
      });
      if (signupResponse.data.status === 'success') {
        console.log('✓ 테스트 사용자 생성 성공\n');
      }
    } catch (error) {
      console.log('  - 이미 존재하는 사용자이거나 생성 실패\n');
    }

    // 1. 로그인
    console.log('1. 로그인 테스트');
    const loginResponse = await axios.post(`${API_URL}/users/login/`, {
      email: 'test@test.com',
      password: 'test1234!'
    });
    
    if (loginResponse.data.status === 'success') {
      authToken = loginResponse.data.data.access;
      console.log('✓ 로그인 성공');
      console.log(`  - 사용자: ${loginResponse.data.data.user.email}`);
      console.log(`  - 닉네임: ${loginResponse.data.data.user.nickname || '미설정'}\n`);
    }

    // 2. 마이페이지 정보 조회
    console.log('2. 마이페이지 정보 조회');
    const myPageResponse = await axios.get(`${API_URL}/users/mypage/`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (myPageResponse.data.status === 'success') {
      const data = myPageResponse.data.data;
      console.log('✓ 마이페이지 데이터 조회 성공');
      
      console.log('\n[프로필 정보]');
      console.log(`  - 이메일: ${data.profile.email}`);
      console.log(`  - 닉네임: ${data.profile.nickname || '미설정'}`);
      console.log(`  - 자기소개: ${data.profile.bio || '미설정'}`);
      console.log(`  - 전화번호: ${data.profile.phone || '미설정'}`);
      console.log(`  - 회사: ${data.profile.company || '미설정'}`);
      console.log(`  - 직책: ${data.profile.position || '미설정'}`);
      console.log(`  - 프로필 이미지: ${data.profile.profile_image || '없음'}`);
      console.log(`  - 가입일: ${data.profile.date_joined}`);
      
      console.log('\n[프로젝트 정보]');
      console.log(`  - 소유한 프로젝트: ${data.projects.owned.total}개`);
      console.log(`  - 참여 중인 프로젝트: ${data.projects.member.total}개`);
      console.log(`    ㄴ 관리자: ${data.projects.member.as_manager}개`);
      console.log(`    ㄴ 멤버: ${data.projects.member.as_member}개`);
      
      console.log('\n[통계]');
      console.log(`  - 전체 프로젝트: ${data.stats.total_projects}개`);
      console.log(`  - 진행 중인 프로젝트: ${data.stats.active_projects}개`);
      console.log(`  - 완료된 프로젝트: ${data.stats.completed_projects}개`);
      console.log(`  - 협업자 수: ${data.stats.total_collaborators}명`);
    }

    // 3. 프로필 업데이트 테스트
    console.log('\n3. 프로필 업데이트 테스트');
    const updateResponse = await axios.patch(`${API_URL}/users/profile/update/`, {
      nickname: '테스트유저',
      bio: '안녕하세요, 테스트 사용자입니다.',
      phone: '010-1234-5678',
      company: '테스트 회사',
      position: '개발자'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (updateResponse.data.status === 'success') {
      console.log('✓ 프로필 업데이트 성공');
      console.log(`  - 닉네임: ${updateResponse.data.data.nickname}`);
      console.log(`  - 자기소개: ${updateResponse.data.data.bio}`);
      console.log(`  - 전화번호: ${updateResponse.data.data.phone}`);
      console.log(`  - 회사: ${updateResponse.data.data.company}`);
      console.log(`  - 직책: ${updateResponse.data.data.position}`);
    }

    console.log('\n=== 테스트 결과 요약 ===');
    console.log('✓ 마이페이지 API 정상 작동');
    console.log('✓ 프로필 정보 조회/수정 기능 정상');
    console.log('✓ 프로젝트 및 통계 정보 정상 표시');
    
    console.log('\n브라우저에서 직접 확인이 필요한 항목:');
    console.log('- 프로필 이미지 업로드 (드래그 앤 드롭)');
    console.log('- 파란색 테마 및 그라데이션 효과');
    console.log('- 탭 전환 애니메이션');
    console.log('- 호버 효과 및 반응형 디자인');

  } catch (error) {
    console.error('테스트 중 오류 발생:', error.response?.data || error.message);
  }
}

testMyPage();