import 'css/Cms/Cms.scss'
/* 상단 이미지 - 샘플, 기본 */

import React, { useState, useEffect } from 'react'

export default function ProjectInput({ inputs, onChange }) {
  const { name, manager, consumer, description, tone_manner, genre, concept } = inputs
  
  const [showCustomTone, setShowCustomTone] = useState(false)
  const [showCustomGenre, setShowCustomGenre] = useState(false)
  const [showCustomConcept, setShowCustomConcept] = useState(false)
  
  const toneOptions = [
    '밝고 경쾌한',
    '진중하고 차분한',
    '감성적이고 따뜻한',
    '역동적이고 활기찬',
    '모던하고 세련된',
    '직접입력'
  ]
  
  const genreOptions = [
    '기업 홍보',
    '제품 소개',
    '브랜드 필름',
    '다큐멘터리',
    '교육/강의',
    '직접입력'
  ]
  
  const conceptOptions = [
    '스토리텔링',
    '인터뷰',
    '모션그래픽',
    '실사 촬영',
    '애니메이션',
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
        {!showCustomTone ? (
          <select
            className="ty01 mt10"
            value={tone_manner}
            onChange={(e) => handleToneChange(e.target.value)}
          >
            <option value="">선택하세요</option>
            {toneOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            name="tone_manner"
            placeholder="톤앤매너를 입력하세요"
            className="ty01 mt10"
            value={tone_manner}
            onChange={onChange}
            maxLength={50}
          />
        )}
      </div>
      <div className="part">
        <div className="s_title">장르</div>
        {!showCustomGenre ? (
          <select
            className="ty01 mt10"
            value={genre}
            onChange={(e) => handleGenreChange(e.target.value)}
          >
            <option value="">선택하세요</option>
            {genreOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            name="genre"
            placeholder="장르를 입력하세요"
            className="ty01 mt10"
            value={genre}
            onChange={onChange}
            maxLength={50}
          />
        )}
      </div>
      <div className="part">
        <div className="s_title">콘셉트</div>
        {!showCustomConcept ? (
          <select
            className="ty01 mt10"
            value={concept}
            onChange={(e) => handleConceptChange(e.target.value)}
          >
            <option value="">선택하세요</option>
            {conceptOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            name="concept"
            placeholder="콘셉트를 입력하세요"
            className="ty01 mt10"
            value={concept}
            onChange={onChange}
            maxLength={50}
          />
        )}
      </div>
    </>
  )
}
React.memo(ProjectInput)
