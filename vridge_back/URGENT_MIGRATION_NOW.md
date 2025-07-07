# 🚨 **긴급 - 5초만에 마이그레이션 실행하기**

## **가장 빠른 방법: 웹 브라우저에서 바로 실행**

### 1️⃣ **브라우저 열고 아래 URL 접속:**
```
https://videoplanet.up.railway.app/emergency-migrate/?secret=migrate2024
```

### 2️⃣ **결과 확인**
- ✅ "All migrations applied successfully!" → 성공!
- ⚠️ "Missing: ..." → 누락된 테이블/컬럼 표시

---

## **대안 방법: Railway CLI (1분)**

터미널에서:
```bash
# Railway 프로젝트에 연결되어 있다면
railway run python manage.py migrate

# 또는 Railway 환경 진입 후
railway shell
python manage.py migrate
exit
```

---

## **Railway 대시보드 방법 (2분)**

1. https://railway.app 로그인
2. VideoPlanet 백엔드 서비스 클릭
3. 우측 상단 "New" → "Job" 클릭
4. Command에 입력: `python manage.py migrate`
5. "Run Job" 클릭

---

## **확인 방법**

마이그레이션 후 다음 API가 정상 작동해야 함:
- https://videoplanet.up.railway.app/api/projects/
- https://videoplanet.up.railway.app/api/video-planning/recent/

---

## **문제 지속 시**

1. **캐시 테이블 생성 필요할 수 있음:**
```bash
railway run python manage.py createcachetable
```

2. **강제 마이그레이션:**
```bash
railway run python manage.py migrate --fake-initial
```

3. **특정 앱만 마이그레이션:**
```bash
railway run python manage.py migrate projects
railway run python manage.py migrate video_planning
```

---

## 📞 **도움 필요 시**

- Railway 로그 확인: https://railway.app → 프로젝트 → Logs
- 에러 메시지 캡처해서 공유
- `/emergency-migrate/?secret=migrate2024` 결과 JSON 공유