# 🔧 Vercel Root Directory 오류 해결

## 🚨 문제
```
The specified Root Directory "vridge_front" does not exist.
```

## ✅ 즉시 해결 방법

### Option 1: Vercel 대시보드에서 수정 (권장)
1. **[Vercel Dashboard](https://vercel.com/dashboard)** 접속
2. 프로젝트 선택
3. **Settings** → **General**
4. **Root Directory** 섹션 찾기
5. 다음 중 하나로 변경:
   - 비워두기 (기본값) ✅
   - `.` (점) 입력 ✅
   - 또는 드롭다운에서 `vridge_front` 선택
6. **Save** 클릭
7. **Deployments** 탭 → **Redeploy** 클릭

### Option 2: 새 프로젝트로 Import
더 확실한 방법:

1. **[새 프로젝트 Import](https://vercel.com/new/clone?repository-url=https://github.com/winnmedia/Vlanet-v1.0)**
2. Import 과정에서:
   - **Root Directory**: 드롭다운에서 `vridge_front` 선택
   - 폴더 아이콘 클릭하여 시각적으로 선택
3. 환경 변수 추가:
   ```
   NEXT_PUBLIC_API_URL = https://videoplanet.up.railway.app
   NEXT_PUBLIC_VERSION = 1.0.0
   ```
4. **Deploy** 클릭

## 📁 저장소 구조 확인
```
Vlanet-v1.0/              ← Vercel이 여기서 시작
├── vridge_front/         ← Next.js 프로젝트 위치
│   ├── package.json
│   ├── next.config.js
│   └── src/
├── vridge_back/
└── .github/
```

## 🎯 검증된 설정
- **Framework Preset**: Next.js
- **Root Directory**: `vridge_front` (드롭다운에서 선택)
- **Build Command**: 자동 감지
- **Output Directory**: 자동 감지

---
**가장 빠른 해결**: Vercel 대시보드에서 Root Directory 수정!