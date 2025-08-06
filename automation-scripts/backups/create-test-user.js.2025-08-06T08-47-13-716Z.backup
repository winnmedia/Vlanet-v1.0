const axios = require('axios');

async function createTestUser() {
  const API_URL = 'http://localhost:8000';
  
  console.log('=== 테스트 사용자 생성 ===');
  
  const testUser = {
    username: 'test@example.com',
    email: 'test@example.com',
    password: 'test1234',
    password2: 'test1234',
    nickname: '테스트유저'
  };
  
  try {
    // 1. 회원가입 시도
    console.log('\n1. 회원가입 시도...');
    const signupResponse = await axios.post(`${API_URL}/api/signup/`, testUser, {
      validateStatus: () => true
    });
    
    if (signupResponse.status === 201) {
      console.log('✅ 회원가입 성공!');
    } else if (signupResponse.status === 400 && signupResponse.data.email) {
      console.log('ℹ️  이미 존재하는 사용자입니다.');
    } else {
      console.log('❌ 회원가입 실패:', signupResponse.data);
    }
    
    // 2. 로그인 테스트
    console.log('\n2. 로그인 테스트...');
    const loginResponse = await axios.post(`${API_URL}/api/login/`, {
      username: testUser.email,
      password: testUser.password
    }, {
      validateStatus: () => true
    });
    
    if (loginResponse.status === 200) {
      console.log('✅ 로그인 성공!');
      console.log('   토큰:', loginResponse.data.access ? '발급됨' : '없음');
      console.log('   사용자:', loginResponse.data.user?.email);
    } else {
      console.log('❌ 로그인 실패:', loginResponse.data);
    }
    
    console.log('\n=== 테스트 계정 정보 ===');
    console.log('이메일:', testUser.email);
    console.log('비밀번호:', testUser.password);
    
  } catch (error) {
    console.error('오류 발생:', error.message);
  }
}

// Django 관리자 명령으로 사용자 생성
async function createUserViaDjango() {
  console.log('\n=== Django 명령으로 사용자 생성 ===');
  console.log('다음 명령을 실행하세요:');
  console.log(`
cd /home/winnmedia/VideoPlanet/vridge_back
python manage.py shell

from users.models import User
user = User.objects.create_user(
    username='test@example.com',
    email='test@example.com',
    password='test1234',
    nickname='테스트유저'
)
print(f"사용자 생성 완료: {user.email}")
exit()
  `);
}

// 실행
createTestUser().then(() => {
  createUserViaDjango();
});