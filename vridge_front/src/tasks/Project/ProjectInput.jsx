import 'css/Cms/Cms.scss'
/* 상단 이미지 - 샘플, 기본 */

import React, { useState, useEffect } from 'react'

export default function ProjectInput({ inputs, onChange }) {
  const { name, manager, consumer, description, tone_manner, genre, concept } = inputs
  
  const [showCustomTone, setShowCustomTone] = useState(false)
  const [showCustomGenre, setShowCustomGenre] = useState(false)
  const [showCustomConcept, setShowCustomConcept] = useState(false)
  
  const toneOptions = [
    // 기본 톤
    '밝고 경쾌한',
    '진중하고 차분한',
    '감성적이고 따뜻한',
    '역동적이고 활기찬',
    '모던하고 세련된',
    // 정서적 톤
    '웅장하고 장대한',
    '서정적이고 아름다운',
    '신비롭고 몽환적인',
    '친근하고 편안한',
    '향수를 불러일으키는',
    // 스타일리시 톤
    '미니멀하고 깔끔한',
    '럭셔리하고 고급스러운',
    '아티스틱하고 예술적인',
    '솔직하고 진정성 있는',
    '레트로하고 빈티지한',
    // 특별한 톤
    '재미있고 유쾌한',
    '긴장감 있고 스릴 넘치는',
    '차분하고 명상적인',
    '테크놀로지컬하고 미래적인',
    '자연친화적이고 에코',
    '직접입력'
  ]
  
  const genreOptions = [
    // 기업/비즈니스
    '기업 홍보',
    '제품 소개',
    '브랜드 필름',
    '브랜드 스토리',
    'IR/투자 설명',
    '채용 홍보',
    // 다큐/교육
    '다큐멘터리',
    '교육/강의',
    '튜토리얼',
    '하우투(How-to)',
    '온라인 코스',
    // 엔터테인먼트
    '뮤직비디오',
    '웹드라마',
    '예능/방송',
    '트레일러',
    '탰저',
    // 마케팅/광고
    '광고 CF',
    '소셜 미디어 콘텐츠',
    '리뷰/언박싱',
    '이벤트 프로모션',
    '캔페인 영상',
    // 기타
    '예술 작품',
    '개인 브이로그',
    '여행 브이로그',
    '푸드 콘텐츠',
    '부동산 투어',
    '직접입력'
  ]
  
  const conceptOptions = [
    // 스토리텔링 방식
    '스토리텔링',
    '인터뷰/대담',
    '모큐멘터리',
    '내레이션',
    '다큐멘터리',
    // 시각적 스타일
    '모션그래픽',
    '2D 애니메이션',
    '3D 애니메이션',
    '실사 촬영',
    '혼합 기법',
    // 표현 방식
    '캐릭터 중심',
    '터이바라웃',
    '인포그래픽',
    '타임랩스',
    '브이로그 스타일',
    // 특수 기법
    '드론 촬영',
    'VR/360도',
    '원테이크',
    '타임라인',
    '페이크 다큐',
    '직접입력'
  ]
  
  const handleToneChange = (value) => {
    if (value === '직접입력') {
      setShowCustomTone(true)
      onChange({ target: { name: 'tone_manner', value: '' } })
    } else {
      setShowCustomTone(false)
      onChange({ target: { name: 'tone_manner', value } })
    }
  }
  
  const handleGenreChange = (value) => {
    if (value === '직접입력') {
      setShowCustomGenre(true)
      onChange({ target: { name: 'genre', value: '' } })
    } else {
      setShowCustomGenre(false)
      onChange({ target: { name: 'genre', value } })
    }
  }
  
  const handleConceptChange = (value) => {
    if (value === '직접입력') {
      setShowCustomConcept(true)
      onChange({ target: { name: 'concept', value: '' } })
    } else {
      setShowCustomConcept(false)
      onChange({ target: { name: 'concept', value } })
    }
  }
  return (
    <>
      <div className="part">
        <div className="s_title">프로젝트 이름</div>
        <input
          type="text"
          name="name"
          placeholder="프로젝트 이름"
          className="ty01 mt10"
          value={name}
          onChange={onChange}
          maxLength={50}
        />
      </div>
      <div className="part">
        <div className="s_title">담당자</div>
        <input
          type="text"
          name="manager"
          placeholder="담당자"
          className="ty01 mt10"
          value={manager}
          onChange={onChange}
          maxLength={50}
        />
      </div>
      <div className="part">
        <div className="s_title">고객사</div>
        <input
          type="text"
          name="consumer"
          placeholder="고객사"
          className="ty01 mt10"
          value={consumer}
          onChange={onChange}
          maxLength={50}
        />
      </div>
      <div className="part">
        <div className="s_title">프로젝트 세부 설명(100자)</div>
        <textarea
          name="description"
          className="mt10"
          cols="30"
          rows="10"
          placeholder="프로젝트 세부 설명"
          value={description}
          maxLength={100}
          onChange={onChange}
        ></textarea>
      </div>
      <div className="part">
        <div className="s_title">톤앤매너</div>
        <div className="custom-select-wrapper">
          {!showCustomTone ? (
            <select
              className="ty01 mt10"
              value={tone_manner}
              onChange={(e) => handleToneChange(e.target.value)}
            >
              <option value="">선택하세요</option>
              <optgroup label="기본 톤">
                <option value="밝고 경쾌한">밝고 경쾌한</option>
                <option value="진중하고 차분한">진중하고 차분한</option>
                <option value="감성적이고 따뜻한">감성적이고 따뜻한</option>
                <option value="역동적이고 활기찬">역동적이고 활기찬</option>
                <option value="모던하고 세련된">모던하고 세련된</option>
              </optgroup>
              <optgroup label="정서적 톤">
                <option value="웅장하고 장대한">웅장하고 장대한</option>
                <option value="서정적이고 아름다운">서정적이고 아름다운</option>
                <option value="신비롭고 몽환적인">신비롭고 몽환적인</option>
                <option value="친근하고 편안한">친근하고 편안한</option>
                <option value="향수를 불러일으키는">향수를 불러일으키는</option>
              </optgroup>
              <optgroup label="스타일리시 톤">
                <option value="미니멀하고 깔끔한">미니멀하고 깔끔한</option>
                <option value="럭셔리하고 고급스러운">럭셔리하고 고급스러운</option>
                <option value="아티스틱하고 예술적인">아티스틱하고 예술적인</option>
                <option value="솔직하고 진정성 있는">솔직하고 진정성 있는</option>
                <option value="레트로하고 빈티지한">레트로하고 빈티지한</option>
              </optgroup>
              <optgroup label="특별한 톤">
                <option value="재미있고 유쾌한">재미있고 유쾌한</option>
                <option value="긴장감 있고 스릴 넘치는">긴장감 있고 스릴 넘치는</option>
                <option value="차분하고 명상적인">차분하고 명상적인</option>
                <option value="테크놀로지컬하고 미래적인">테크놀로지컬하고 미래적인</option>
                <option value="자연친화적이고 에코">자연친화적이고 에코</option>
              </optgroup>
              <option value="직접입력" style={{fontWeight: 'bold'}}>✅ 직접입력</option>
            </select>
          ) : (
            <div className="custom-input-wrapper">
              <input
                type="text"
                name="tone_manner"
                placeholder="원하시는 톤앤매너를 자유롭게 입력해주세요"
                className="ty01"
                value={tone_manner}
                onChange={onChange}
                maxLength={50}
              />
              <button 
                className="cancel-custom-btn"
                onClick={() => {
                  setShowCustomTone(false);
                  onChange({ target: { name: 'tone_manner', value: '' } });
                }}
              >
                선택목록으로
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="part">
        <div className="s_title">장르</div>
        <div className="custom-select-wrapper">
          {!showCustomGenre ? (
            <select
              className="ty01 mt10"
              value={genre}
              onChange={(e) => handleGenreChange(e.target.value)}
            >
              <option value="">선택하세요</option>
              <optgroup label="기업/비즈니스">
                <option value="기업 홍보">기업 홍보</option>
                <option value="제품 소개">제품 소개</option>
                <option value="브랜드 필름">브랜드 필름</option>
                <option value="브랜드 스토리">브랜드 스토리</option>
                <option value="IR/투자 설명">IR/투자 설명</option>
                <option value="채용 홍보">채용 홍보</option>
              </optgroup>
              <optgroup label="다큐/교육">
                <option value="다큐멘터리">다큐멘터리</option>
                <option value="교육/강의">교육/강의</option>
                <option value="튜토리얼">튜토리얼</option>
                <option value="하우투(How-to)">하우투(How-to)</option>
                <option value="온라인 코스">온라인 코스</option>
              </optgroup>
              <optgroup label="엔터테인먼트">
                <option value="뮤직비디오">뮤직비디오</option>
                <option value="웹드라마">웹드라마</option>
                <option value="예능/방송">예능/방송</option>
                <option value="트레일러">트레일러</option>
                <option value="티저">티저</option>
              </optgroup>
              <optgroup label="마케팅/광고">
                <option value="광고 CF">광고 CF</option>
                <option value="소셜 미디어 콘텐츠">소셜 미디어 콘텐츠</option>
                <option value="리뷰/언박싱">리뷰/언박싱</option>
                <option value="이벤트 프로모션">이벤트 프로모션</option>
                <option value="캠페인 영상">캠페인 영상</option>
              </optgroup>
              <optgroup label="기타">
                <option value="예술 작품">예술 작품</option>
                <option value="개인 브이로그">개인 브이로그</option>
                <option value="여행 브이로그">여행 브이로그</option>
                <option value="푸드 콘텐츠">푸드 콘텐츠</option>
                <option value="부동산 투어">부동산 투어</option>
              </optgroup>
              <option value="직접입력" style={{fontWeight: 'bold'}}>✅ 직접입력</option>
            </select>
          ) : (
            <div className="custom-input-wrapper">
              <input
                type="text"
                name="genre"
                placeholder="원하시는 장르를 자유롭게 입력해주세요"
                className="ty01"
                value={genre}
                onChange={onChange}
                maxLength={50}
              />
              <button 
                className="cancel-custom-btn"
                onClick={() => {
                  setShowCustomGenre(false);
                  onChange({ target: { name: 'genre', value: '' } });
                }}
              >
                선택목록으로
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="part">
        <div className="s_title">콘셉트</div>
        <div className="custom-select-wrapper">
          {!showCustomConcept ? (
            <select
              className="ty01 mt10"
              value={concept}
              onChange={(e) => handleConceptChange(e.target.value)}
            >
              <option value="">선택하세요</option>
              <optgroup label="스토리텔링 방식">
                <option value="스토리텔링">스토리텔링</option>
                <option value="인터뷰/대담">인터뷰/대담</option>
                <option value="모큐멘터리">모큐멘터리</option>
                <option value="내레이션">내레이션</option>
                <option value="다큐멘터리">다큐멘터리</option>
              </optgroup>
              <optgroup label="시각적 스타일">
                <option value="모션그래픽">모션그래픽</option>
                <option value="2D 애니메이션">2D 애니메이션</option>
                <option value="3D 애니메이션">3D 애니메이션</option>
                <option value="실사 촬영">실사 촬영</option>
                <option value="혼합 기법">혼합 기법</option>
              </optgroup>
              <optgroup label="표현 방식">
                <option value="캐릭터 중심">캐릭터 중심</option>
                <option value="터이바라웃">터이바라웃</option>
                <option value="인포그래픽">인포그래픽</option>
                <option value="타임랩스">타임랩스</option>
                <option value="브이로그 스타일">브이로그 스타일</option>
              </optgroup>
              <optgroup label="특수 기법">
                <option value="드론 촬영">드론 촬영</option>
                <option value="VR/360도">VR/360도</option>
                <option value="원테이크">원테이크</option>
                <option value="타임라인">타임라인</option>
                <option value="페이크 다큐">페이크 다큐</option>
              </optgroup>
              <option value="직접입력" style={{fontWeight: 'bold'}}>✅ 직접입력</option>
            </select>
          ) : (
            <div className="custom-input-wrapper">
              <input
                type="text"
                name="concept"
                placeholder="원하시는 콘셉트를 자유롭게 입력해주세요"
                className="ty01"
                value={concept}
                onChange={onChange}
                maxLength={50}
              />
              <button 
                className="cancel-custom-btn"
                onClick={() => {
                  setShowCustomConcept(false);
                  onChange({ target: { name: 'concept', value: '' } });
                }}
              >
                선택목록으로
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
React.memo(ProjectInput)
