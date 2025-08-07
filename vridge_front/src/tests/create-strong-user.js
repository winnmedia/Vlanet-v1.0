const axios = require('axios');

async function createStrongUser() {
  console.log('=== 강력한 비밀번호로 사용자 생성 ===\n');
  
  const API_URL = 'https://videoplanet.up.railway.app';
  
  // 강력한 비밀번호 (대문자, 소문자, 숫자, 특수문자 포함)
  const signupData = {
    email: 'test@videoplanet.com',
    password: 'Test1234!@#',
    passwordConfirm: 'Test1234!@#',
    nickname: '테스트유저',
    login_method: 'email'
  };
  
  try {
    console.log('1. 회원가입 시도');
    console.log('   이메일:', signupData.email);
    console.log('   비밀번호:', signupData.password);
    
    const signupResponse = await axios.post(`${API_URL}/api/users/signup/`, signupData, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true
    });
    
    console.log('\n   회원가입 상태:', signupResponse.status);
    
    if (signupResponse.status === 201 || signupResponse.status === 200) {
      console.log('   ✅ 회원가입 성공!');
      console.log('   응답:', signupResponse.data);
      
      // 로그인 테스트
      console.log('\n2. 로그인 테스트');
      const loginData = {
        email: signupData.email,
        password: signupData.password
      };
      
      const loginResponse = await axios.post(`${API_URL}/api/users/login/`, loginData, {
        headers: {
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      });
      
      console.log('   로그인 상태:', loginResponse.status);
      if (loginResponse.status === 200) {
        console.log('   ✅ 로그인 성공!');
        const token = loginResponse.data.vridge_session;
        console.log('   토큰:', token ? token.substring(0, 50) + '...' : 'No token');
        
        // 사용자 정보 확인
        if (token) {
          console.log('\n3. 사용자 정보 확인');
          const meResponse = await axios.get(`${API_URL}/api/users/me/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            validateStatus: () => true
          });
          
          console.log('   사용자 정보 상태:', meResponse.status);
          if (meResponse.status === 200) {
            console.log('   ✅ 사용자 정보:');
            console.log('      - 이메일:', meResponse.data.email);
            console.log('      - 닉네임:', meResponse.data.nickname);
            console.log('      - ID:', meResponse.data.id);
          }
        }
      } else {
        console.log('   ❌ 로그인 실패:', loginResponse.data);
      }
    } else if (signupResponse.status === 400) {
      console.log('   ⚠️  회원가입 실패:', signupResponse.data);
      
      // 이미 존재하는 경우 로그인 시도
      if (signupResponse.data.error?.details?.email?.includes('이미 사용')) {
        console.log('\n   이미 존재하는 계정으로 로그인 시도...');
        
        const loginData = {
          email: signupData.email,
          password: signupData.password
        };
        
        const loginResponse = await axios.post(`${API_URL}/api/users/login/`, loginData, {
          headers: {
            'Content-Type': 'application/json'
          },
          validateStatus: () => true
        });
        
        console.log('   로그인 상태:', loginResponse.status);
        if (loginResponse.status === 200) {
          console.log('   ✅ 기존 계정 로그인 성공!');
          const token = loginResponse.data.vridge_session;
          console.log('   토큰:', token ? token.substring(0, 50) + '...' : 'No token');
        } else {
          console.log('   ❌ 로그인 실패:', loginResponse.data);
        }
      }
    } else {
      console.log('   ❌ 회원가입 실패:', signupResponse.data);
    }
    
  } catch (error) {
    console.error('오류:', error.message);
    if (error.response) {
      console.error('응답 데이터:', error.response.data);
    }
  }
  
  console.log('\n=== 테스트 계정 정보 ===');
  console.log('이메일: test@videoplanet.com');
  console.log('비밀번호: Test1234!@#');
}

createStrongUser();