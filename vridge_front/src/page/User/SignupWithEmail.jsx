import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignUpRequest, SignUpVerify, SignUpComplete, CheckNickname } from "api/auth";
import PasswordInput from "component/PasswordInput";
import { CircularProgress } from "@material-ui/core";

const SignupWithEmail = () => {
  const navigate = useNavigate();
  
  // 단계 관리 (1: 이메일 인증, 2: 정보 입력)
  const [step, setStep] = useState(1);
  
  // Step 1: 이메일 인증
  const [email, setEmail] = useState("");
  const [authNumber, setAuthNumber] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Step 2: 정보 입력
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  
  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [nicknameValid, setNicknameValid] = useState(null);
  
  // 이메일 형식 검증
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  // Step 1: 이메일 인증번호 발송
  const handleSendEmail = async () => {
    if (!validateEmail(email)) {
      setErrors({ email: "올바른 이메일 형식이 아닙니다." });
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const response = await SignUpRequest(email);
      if (response.data.message === "success") {
        setEmailSent(true);
        setCountdown(30); // 30초 후 재발송 가능
        alert("인증번호가 이메일로 발송되었습니다.");
      }
    } catch (error) {
      const message = error.response?.data?.message || "이메일 발송에 실패했습니다.";
      setErrors({ email: message });
    } finally {
      setLoading(false);
    }
  };
  
  // Step 1: 인증번호 확인
  const handleVerifyEmail = async () => {
    if (!authNumber || authNumber.length !== 6) {
      setErrors({ auth: "6자리 인증번호를 입력해주세요." });
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const response = await SignUpVerify({ email, auth_number: authNumber });
      if (response.data.message === "success") {
        setAuthToken(response.data.auth_token);
        setStep(2); // 다음 단계로
        alert("이메일 인증이 완료되었습니다.");
      }
    } catch (error) {
      const message = error.response?.data?.message || "인증번호가 올바르지 않습니다.";
      setErrors({ auth: message });
    } finally {
      setLoading(false);
    }
  };
  
  // 닉네임 중복 확인
  const handleCheckNickname = async (value) => {
    if (value.length < 2) {
      setNicknameValid(false);
      return;
    }
    
    try {
      await CheckNickname(value);
      setNicknameValid(true);
    } catch (error) {
      setNicknameValid(false);
    }
  };
  
  // Step 2: 회원가입 완료
  const handleSignUp = async () => {
    const newErrors = {};
    
    if (!nickname || nickname.length < 2) {
      newErrors.nickname = "닉네임은 최소 2자 이상이어야 합니다.";
    }
    
    if (!password || password.length < 10) {
      newErrors.password = "비밀번호는 최소 10자 이상이어야 합니다.";
    }
    
    if (password !== passwordConfirm) {
      newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const response = await SignUpComplete({
        email,
        auth_token: authToken,
        nickname,
        password
      });
      
      if (response.data.message === "success") {
        // 토큰 저장
        localStorage.setItem("VGID", JSON.stringify(response.data.vridge_session));
        alert("회원가입이 완료되었습니다!");
        navigate("/CmsHome");
      }
    } catch (error) {
      const message = error.response?.data?.message || "회원가입에 실패했습니다.";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="signup-container">
      <div className="signup-box">
        <h1>회원가입</h1>
        
        {/* Progress Bar */}
        <div className="progress-bar">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1. 이메일 인증</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2. 정보 입력</div>
        </div>
        
        {step === 1 && (
          <div className="step-1">
            <h2>이메일 인증</h2>
            
            <div className="form-group">
              <label>이메일</label>
              <div className="input-with-button">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력하세요"
                  disabled={emailSent}
                />
                <button
                  onClick={handleSendEmail}
                  disabled={loading || (emailSent && countdown > 0)}
                >
                  {loading ? <CircularProgress size={20} /> : 
                   countdown > 0 ? `재발송 (${countdown}초)` : 
                   emailSent ? "재발송" : "인증번호 발송"}
                </button>
              </div>
              {errors.email && <span className="error">{errors.email}</span>}
            </div>
            
            {emailSent && (
              <div className="form-group">
                <label>인증번호</label>
                <input
                  type="text"
                  value={authNumber}
                  onChange={(e) => setAuthNumber(e.target.value)}
                  placeholder="6자리 인증번호 입력"
                  maxLength={6}
                />
                {errors.auth && <span className="error">{errors.auth}</span>}
                
                <button
                  className="verify-button"
                  onClick={handleVerifyEmail}
                  disabled={loading || !authNumber}
                >
                  {loading ? <CircularProgress size={20} /> : "인증 확인"}
                </button>
              </div>
            )}
          </div>
        )}
        
        {step === 2 && (
          <div className="step-2">
            <h2>정보 입력</h2>
            
            <div className="form-group">
              <label>이메일 (인증 완료)</label>
              <input type="email" value={email} disabled />
            </div>
            
            <div className="form-group">
              <label>닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  handleCheckNickname(e.target.value);
                }}
                placeholder="닉네임을 입력하세요 (2자 이상)"
              />
              {nicknameValid === true && <span className="success">✓ 사용 가능한 닉네임입니다.</span>}
              {nicknameValid === false && <span className="error">✗ 사용할 수 없는 닉네임입니다.</span>}
              {errors.nickname && <span className="error">{errors.nickname}</span>}
            </div>
            
            <div className="form-group">
              <label>비밀번호</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요 (10자 이상)"
              />
              {errors.password && <span className="error">{errors.password}</span>}
            </div>
            
            <div className="form-group">
              <label>비밀번호 확인</label>
              <PasswordInput
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
              />
              {errors.passwordConfirm && <span className="error">{errors.passwordConfirm}</span>}
            </div>
            
            {errors.general && <div className="error general">{errors.general}</div>}
            
            <button
              className="signup-button"
              onClick={handleSignUp}
              disabled={loading || !nicknameValid}
            >
              {loading ? <CircularProgress size={20} /> : "회원가입 완료"}
            </button>
          </div>
        )}
        
        <div className="login-link">
          이미 계정이 있으신가요? <a href="/Login">로그인</a>
        </div>
      </div>
    </div>
  );
};

export default SignupWithEmail;