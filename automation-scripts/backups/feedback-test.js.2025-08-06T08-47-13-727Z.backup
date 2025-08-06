const axios = require('axios');
const colors = require('colors');

// 환경 설정
const BASE_URL = process.env.API_URL || 'https://videoplanet.up.railway.app';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test123!@#';

// 테스트 유틸리티
class FeedbackTester {
  constructor() {
    this.token = null;
    this.projectId = null;
    this.feedbackId = null;
    this.messageId = null;
  }

  async login() {
    console.log('\n🔐 로그인 시도...'.cyan);
    try {
      const response = await axios.post(`${BASE_URL}/api/users/login/`, {
        username: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      
      this.token = response.data.user.token;
      console.log('✅ 로그인 성공'.green);
      console.log(`   토큰: ${this.token.substring(0, 20)}...`);
      return true;
    } catch (error) {
      console.error('❌ 로그인 실패:'.red, error.response?.data);
      return false;
    }
  }

  async getProjects() {
    console.log('\n📋 프로젝트 목록 조회...'.cyan);
    try {
      const response = await axios.get(`${BASE_URL}/api/projects/`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      const projects = response.data.result;
      if (projects && projects.length > 0) {
        this.projectId = projects[0].id;
        console.log('✅ 프로젝트 목록 조회 성공'.green);
        console.log(`   프로젝트 수: ${projects.length}`);
        console.log(`   선택된 프로젝트 ID: ${this.projectId}`);
        return true;
      } else {
        console.log('⚠️  프로젝트가 없습니다'.yellow);
        return false;
      }
    } catch (error) {
      console.error('❌ 프로젝트 목록 조회 실패:'.red, error.response?.data);
      return false;
    }
  }

  async getFeedback() {
    console.log('\n💬 피드백 조회...'.cyan);
    try {
      const response = await axios.get(`${BASE_URL}/api/feedbacks/${this.projectId}`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      const result = response.data.result;
      console.log('✅ 피드백 조회 성공'.green);
      console.log(`   피드백 수: ${result.feedback?.length || 0}`);
      
      if (result.feedback && result.feedback.length > 0) {
        this.feedbackId = result.feedback[0].id;
        console.log(`   첫 번째 피드백 ID: ${this.feedbackId}`);
        console.log(`   내용: ${result.feedback[0].text || result.feedback[0].message}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ 피드백 조회 실패:'.red, error.response?.data);
      return false;
    }
  }

  async createFeedback() {
    console.log('\n➕ 새 피드백 생성...'.cyan);
    try {
      const testMessage = `테스트 피드백 - ${new Date().toLocaleString('ko-KR')}`;
      const response = await axios.put(
        `${BASE_URL}/api/feedbacks/${this.projectId}`,
        {
          time_at: '00:00:10',
          text: testMessage,
          nickname: '테스터'
        },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );
      
      console.log('✅ 피드백 생성 성공'.green);
      console.log(`   응답:`, response.data);
      
      // 생성된 피드백 ID 찾기
      await this.getFeedback();
      return true;
    } catch (error) {
      console.error('❌ 피드백 생성 실패:'.red, error.response?.data);
      return false;
    }
  }

  async updateFeedback() {
    if (!this.feedbackId) {
      console.log('⚠️  수정할 피드백이 없습니다'.yellow);
      return false;
    }

    console.log('\n✏️  피드백 수정...'.cyan);
    try {
      const updatedMessage = `수정된 피드백 - ${new Date().toLocaleString('ko-KR')}`;
      const response = await axios.patch(
        `${BASE_URL}/api/feedbacks/messages/${this.feedbackId}/`,
        {
          text: updatedMessage
        },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );
      
      console.log('✅ 피드백 수정 성공'.green);
      console.log(`   응답:`, response.data);
      return true;
    } catch (error) {
      console.error('❌ 피드백 수정 실패:'.red, error.response?.data);
      console.error('   상태 코드:', error.response?.status);
      console.error('   URL:', error.config?.url);
      return false;
    }
  }

  async deleteFeedback() {
    if (!this.feedbackId) {
      console.log('⚠️  삭제할 피드백이 없습니다'.yellow);
      return false;
    }

    console.log('\n🗑️  피드백 삭제...'.cyan);
    try {
      const response = await axios.delete(
        `${BASE_URL}/api/feedbacks/messages/${this.feedbackId}/`,
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );
      
      console.log('✅ 피드백 삭제 성공'.green);
      console.log(`   응답:`, response.data);
      return true;
    } catch (error) {
      console.error('❌ 피드백 삭제 실패:'.red, error.response?.data);
      console.error('   상태 코드:', error.response?.status);
      return false;
    }
  }

  async updateFeedbackStatus() {
    if (!this.feedbackId) {
      console.log('⚠️  상태를 변경할 피드백이 없습니다'.yellow);
      return false;
    }

    console.log('\n📌 피드백 상태 변경...'.cyan);
    try {
      const response = await axios.patch(
        `${BASE_URL}/api/feedbacks/messages/${this.feedbackId}/status/`,
        {
          status: 'completed'
        },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );
      
      console.log('✅ 피드백 상태 변경 성공'.green);
      console.log(`   응답:`, response.data);
      return true;
    } catch (error) {
      console.error('❌ 피드백 상태 변경 실패:'.red, error.response?.data);
      console.error('   상태 코드:', error.response?.status);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 피드백 기능 종합 테스트 시작'.bold.cyan);
    console.log('================================'.cyan);

    // 로그인
    if (!await this.login()) {
      console.log('\n❌ 테스트 중단: 로그인 실패'.red);
      return;
    }

    // 프로젝트 조회
    if (!await this.getProjects()) {
      console.log('\n❌ 테스트 중단: 프로젝트 조회 실패'.red);
      return;
    }

    // 피드백 조회
    await this.getFeedback();

    // 새 피드백 생성
    await this.createFeedback();

    // 피드백 수정
    await this.updateFeedback();

    // 피드백 상태 변경
    await this.updateFeedbackStatus();

    // 피드백 삭제
    await this.deleteFeedback();

    // 최종 피드백 목록 확인
    console.log('\n📊 최종 피드백 목록 확인...'.cyan);
    await this.getFeedback();

    console.log('\n================================'.cyan);
    console.log('✅ 피드백 기능 테스트 완료!'.bold.green);
  }
}

// 테스트 실행
const tester = new FeedbackTester();
tester.runAllTests().catch(error => {
  console.error('테스트 실행 중 오류:', error);
});