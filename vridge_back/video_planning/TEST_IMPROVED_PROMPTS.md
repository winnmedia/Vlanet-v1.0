# 개선된 DALL-E 프롬프트 생성 테스트 가이드

## 엔드포인트
- **URL**: `/api/video-planning/test-improved-prompts/`
- **Method**: POST
- **Permission**: AllowAny (인증 불필요)

## 요청 형식
```json
{
    "description": "한국어 또는 영어 설명",
    "style": "minimal|detailed|artistic|cinematic"
}
```

## 응답 형식
```json
{
    "status": "success",
    "input": {
        "original": "원본 설명",
        "style": "선택한 스타일"
    },
    "processing": {
        "is_english": true/false,
        "translated": "번역된 텍스트 (한국어인 경우)"
    },
    "output": {
        "improved_prompt": "개선된 DALL-E 프롬프트",
        "style_parameters": {
            "quality": "standard/hd",
            "style": "natural/vivid",
            "additional_prompt": "추가 스타일 지시사항"
        }
    }
}
```

## 테스트 방법

### 1. CURL 사용
```bash
# 한국어 입력 테스트
curl -X POST https://videoplanet.up.railway.app/api/video-planning/test-improved-prompts/ \
  -H "Content-Type: application/json" \
  -d '{"description": "카페에 들어가는 남자", "style": "minimal"}' | python -m json.tool

# 영어 입력 테스트
curl -X POST https://videoplanet.up.railway.app/api/video-planning/test-improved-prompts/ \
  -H "Content-Type: application/json" \
  -d '{"description": "A woman walking in the rain", "style": "cinematic"}' | python -m json.tool
```

### 2. Python 스크립트 사용
```bash
# 프로덕션 서버 테스트
python test_improved_prompts.py

# 로컬 서버 테스트
python test_improved_prompts.py local
```

### 3. Bash 스크립트 사용
```bash
./test_prompts_curl.sh
```

## 스타일 옵션

1. **minimal** (기본값)
   - 간결하고 깔끔한 스타일
   - quality: standard, style: natural
   - 추가: "clean minimalist style"

2. **detailed**
   - 상세하고 사실적인 스타일
   - quality: hd, style: vivid
   - 추가: "highly detailed photorealistic"

3. **artistic**
   - 예술적이고 창의적인 스타일
   - quality: hd, style: vivid
   - 추가: "artistic creative interpretation"

4. **cinematic**
   - 영화적이고 드라마틱한 스타일
   - quality: hd, style: vivid
   - 추가: "cinematic dramatic lighting"

## 예제 테스트 케이스

### 한국어 입력
```json
{
    "description": "비오는 밤 거리를 걷는 여성",
    "style": "cinematic"
}
```

예상 결과:
- 영어로 번역됨
- 영화적 스타일 파라미터 적용
- 개선된 프롬프트 생성

### 영어 입력
```json
{
    "description": "An old man reading a book in the park",
    "style": "artistic"
}
```

예상 결과:
- 번역 과정 없음
- 예술적 스타일 파라미터 적용
- 개선된 프롬프트 생성

## 주요 기능

1. **언어 감지**: 입력된 설명이 한국어인지 영어인지 자동 감지
2. **자동 번역**: 한국어 입력 시 영어로 자동 번역
3. **프롬프트 개선**: DALL-E에 최적화된 프롬프트로 변환
4. **스타일 적용**: 선택한 스타일에 맞는 파라미터 자동 적용

## 오류 처리

- `description` 필드가 없는 경우: 400 Bad Request
- 서버 오류 발생 시: 500 Internal Server Error with 상세 메시지