# VideoPlanet Memory - 프로젝트 맥락 및 결정사항 기록

## 프로젝트 구조
```
VideoPlanet/
├── vridge_front/           # 프론트엔드 (React)
│   ├── src/
│   │   ├── page/Cms/      # CMS 페이지들
│   │   ├── tasks/         # 재사용 가능한 컴포넌트
│   │   ├── css/          # 스타일 파일들
│   │   └── api/          # API 통신
│   └── package.json
└── vridge_back/           # 백엔드 (Django)
```

## 작업 히스토리

### 2025-01-27 - Vercel 빌드 오류 재해결
**요청 내용**: 루트 디렉토리의 package.json으로 인한 Vercel 빌드 오류 해결

**문제 분석**:
- 루트 디렉토리에 간단한 package.json 파일이 다시 생성되어 있음
- Vercel이 루트의 package.json을 읽고 build 스크립트를 찾지 못해 오류 발생
- 실제 프론트엔드 package.json은 vridge_front 디렉토리에 위치

**해결 방법**:
1. 루트 디렉토리의 package.json 파일 백업 및 삭제
   - 백업: package.json.backup_20250727_130043
   - 삭제 완료
2. vercel.json은 vridge_front 디렉토리에만 유지 (올바른 상태)

**주요 결정사항**:
- 루트 디렉토리에는 package.json을 두지 않음
- 모든 프론트엔드 관련 설정은 vridge_front 디렉토리에서 관리
- Vercel은 vridge_front를 프로젝트 루트로 인식하도록 유지

### 2025-01-27 - 피드백 페이지 레이아웃 개선
**요청 내용**: 영상 피드백 페이지의 버튼과 레이아웃 정렬 문제 수정
- 반응형 그리드 시스템 구현
- 버튼 정렬 및 간격 통일
- 인터랙션 개선 (카드 호버 효과, 시각적 피드백)

**분석 결과**:
1. 현재 피드백 카드는 고정된 레이아웃 사용 중
2. FeedbackManage는 <ul>/<li> 구조로 단순 리스트 표시
3. FeedbackMore는 날짜별 그룹화와 확장 가능한 UI 제공
4. 버튼들이 인라인 스타일로 관리되어 일관성 부족

**구현 내용**:
1. **새로운 그리드 시스템 (`FeedbackGridLayout.scss`)**:
   - `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))` 적용
   - 반응형 breakpoint: 768px, 1024px
   - 카드 호버 효과: translateY(-4px), box-shadow 추가
   - 일관된 간격 시스템: 4px, 8px, 16px, 24px, 32px

2. **컴포넌트 수정**:
   - FeedbackManage: <ul>/<li> → <div> 그리드 구조로 변경
   - FeedbackMore: 날짜별 그룹화 유지하며 그리드 적용
   - 인라인 스타일 → CSS 클래스로 마이그레이션

3. **버튼 시스템 개선**:
   - actionButtonGroup: 중앙 정렬, 반응형 스크롤
   - 모바일에서 주요 버튼 sticky 배치
   - 일관된 호버/액티브 상태 애니메이션

4. **시각적 개선**:
   - 카드 배경 그라데이션과 subtle한 테두리
   - 시간 뱃지 그라데이션 효과
   - 삭제 버튼 호버 시만 표시 (데스크톱)
   - 부드러운 트랜지션 (0.2s ~ 0.3s cubic-bezier)

**주요 결정사항**:
- 최소 카드 너비 300px로 설정 (모바일 호환성)
- 브랜드 색상 엄격 준수 (#1631F8, #dc3545 등)
- 이모지 사용하되 폰트 대신 유니코드 직접 사용
- 기존 레거시 스타일과의 호환성 유지

### 2025-01-27 - Vercel 배포 오류 해결
**요청 내용**: Vercel 배포 시 "The specified Root Directory 'vridge_front' does not exist" 오류 해결

**문제 분석**:
- 루트 디렉토리와 vridge_front 디렉토리에 각각 vercel.json 파일이 존재
- 루트의 vercel.json에 `rootDirectory: "vridge_front"` 설정이 있어 충돌 발생
- Vercel이 어떤 설정을 우선시해야 할지 혼란

**해결 방법**:
1. 루트 디렉토리의 vercel.json 파일 삭제
2. vridge_front/vercel.json 파일 업데이트:
   - buildCommand, outputDirectory, installCommand 추가
   - framework: "nextjs" 명시
   - env 변수 설정 (NEXT_PUBLIC_API_URL)
   - git.deploymentEnabled: true로 변경

**배포 파이프라인**:
- GitHub push → Vercel 자동 배포 트리거
- vridge_front 디렉토리를 프로젝트 루트로 인식
- Next.js 프로젝트로 정상 빌드 및 배포

**주요 결정사항**:
- 단일 vercel.json 파일 유지 (vridge_front 내부)
- 자동 배포 활성화로 CI/CD 파이프라인 간소화
- 환경 변수는 vercel.json에서 관리