import 'css/Cms/Cms.scss'
/* 상단 이미지 - 샘플, 기본 */

import React, { useState, useEffect } from 'react'

export default function ProjectInput({ inputs, onChange }) {
  const { name, manager, consumer, description } = inputs
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
    </>
  )
}
React.memo(ProjectInput)
