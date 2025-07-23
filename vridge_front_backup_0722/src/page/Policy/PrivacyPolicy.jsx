import React from 'react'
import PageTemplate from 'components/PageTemplate'
import 'css/Policy.scss'

export default function PrivacyPolicy() {
  return (
    <PageTemplate noLogin={true}>
      <div className="policy-container">
        <div className="policy-content">
          <h1>개인정보처리방침</h1>
          <p className="effective-date">시행일: 2024년 1월 1일</p>

          <section>
            <h2>1. 개인정보의 수집 및 이용 목적</h2>
            <p>VideoPlanet(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
            <ul>
              <li>회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리</li>
              <li>서비스 제공: 영상 피드백 서비스, 프로젝트 관리, 콘텐츠 제공</li>
              <li>고충처리: 민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보</li>
            </ul>
          </section>

          <section>
            <h2>2. 수집하는 개인정보 항목</h2>
            <h3>필수항목</h3>
            <ul>
              <li>이메일 주소</li>
              <li>비밀번호 (일반 회원가입 시)</li>
              <li>닉네임</li>
            </ul>
            <h3>선택항목</h3>
            <ul>
              <li>프로필 이미지</li>
              <li>회사/조직명</li>
            </ul>
            <h3>자동 수집 항목</h3>
            <ul>
              <li>IP 주소, 쿠키, 서비스 이용 기록, 방문 일시</li>
            </ul>
          </section>

          <section>
            <h2>3. 개인정보의 보유 및 이용 기간</h2>
            <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
            <ul>
              <li>회원 정보: 회원 탈퇴 시까지</li>
              <li>서비스 이용 기록: 3년</li>
              <li>전자상거래 관련 기록: 5년 (전자상거래법에 따름)</li>
            </ul>
          </section>

          <section>
            <h2>4. 개인정보의 제3자 제공</h2>
            <p>회사는 정보주체의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.</p>
            <ul>
              <li>정보주체로부터 별도의 동의를 받은 경우</li>
              <li>법령에 특별한 규정이 있거나 법적 의무를 준수하기 위해 필요한 경우</li>
            </ul>
          </section>

          <section>
            <h2>5. 개인정보처리 위탁</h2>
            <p>회사는 원활한 서비스 제공을 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
            <table>
              <thead>
                <tr>
                  <th>위탁받는 자</th>
                  <th>위탁 업무 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Amazon Web Services</td>
                  <td>데이터 보관 및 서버 운영</td>
                </tr>
                <tr>
                  <td>Google</td>
                  <td>소셜 로그인 서비스</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2>6. 정보주체의 권리와 의무</h2>
            <p>정보주체는 다음과 같은 권리를 행사할 수 있습니다.</p>
            <ul>
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ul>
          </section>

          <section>
            <h2>7. 개인정보의 파기</h2>
            <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
            <ul>
              <li>파기절차: 불필요한 개인정보는 개인정보 보호책임자의 승인을 받아 파기</li>
              <li>파기방법: 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제</li>
            </ul>
          </section>

          <section>
            <h2>8. 개인정보 보호책임자</h2>
            <p>개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
            <div className="contact-info">
              <p><strong>개인정보보호 책임자</strong></p>
              <p>이메일: privacy@vlanet.net</p>
            </div>
          </section>

          <section>
            <h2>9. 개인정보처리방침 변경</h2>
            <p>이 개인정보처리방침은 2024년 1월 1일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
          </section>
        </div>
      </div>
    </PageTemplate>
  )
}