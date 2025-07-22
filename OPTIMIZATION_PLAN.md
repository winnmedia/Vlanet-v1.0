# VideoPlanet 구조 최적화 및 404 에러 해결 방안

## 현재 문제점 분석

### 1. 404 에러 발생 원인
- SPA의 클라이언트 사이드 라우팅과 서버 사이드 라우팅 불일치
- 직접 URL 접근 시 서버가 해당 파일을 찾지 못함
- API 경로와 프론트엔드 경로 혼재

### 2. 구조적 문제
- 라우트 명명 규칙 일관성 부족 (대소문자 혼용)
- 중복된 라우트 패턴 (invitation 3개)
- API 엔드포인트 레거시 경로와 신규 경로 혼재

## 최적화 방안

### 1. 라우트 구조 개선

#### A. 프론트엔드 라우트 정리
```javascript
// 1. 일관된 소문자 사용
// 2. RESTful 패턴 적용
// 3. 중첩 라우트 활용

const routes = {
  // 인증
  auth: {
    '/': Home,
    '/login': Login,
    '/signup': Signup,
    '/reset-password': ResetPassword,
    '/verify-email/:token': EmailVerification,
  },
  
  // 프로젝트
  projects: {
    '/projects': ProjectList,
    '/projects/new': ProjectCreate,
    '/projects/:id': ProjectView,
    '/projects/:id/edit': ProjectEdit,
    '/projects/:id/feedback': Feedback,
  },
  
  // 관리자
  admin: {
    '/admin': AdminDashboard,
    '/admin/users': AdminUsers,
    '/admin/projects': AdminProjects,
    '/admin/system': AdminSystem,
  }
}
```

#### B. API 엔드포인트 통합
```python
# 레거시 경로 제거하고 /api/ 프리픽스로 통일
urlpatterns = [
    path('api/v1/auth/', include('users.urls')),
    path('api/v1/projects/', include('projects.urls')),
    path('api/v1/feedbacks/', include('feedbacks.urls')),
    path('api/v1/admin/', include('admin_dashboard.urls')),
]
```

### 2. 404 에러 완전 해결

#### A. Vercel 설정 개선
```json
{
  "rewrites": [
    // API 프록시
    {
      "source": "/api/:path*",
      "destination": "https://videoplanet.up.railway.app/api/:path*"
    },
    // 모든 프론트엔드 라우트를 index.html로
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ],
  "redirects": [
    // 레거시 URL 리다이렉트
    {
      "source": "/CmsHome",
      "destination": "/dashboard",
      "permanent": true
    },
    {
      "source": "/ProjectView/:id",
      "destination": "/projects/:id",
      "permanent": true
    }
  ]
}
```

#### B. React Router 개선
```javascript
// 404 페이지 구현
const NotFound = () => (
  <div className="not-found">
    <h1>404 - 페이지를 찾을 수 없습니다</h1>
    <Link to="/">홈으로 돌아가기</Link>
  </div>
);

// 라우트 설정
<Routes>
  {/* 정의된 라우트들 */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

### 3. SEO 및 성능 최적화

#### A. 메타데이터 관리
```javascript
// React Helmet 사용
import { Helmet } from 'react-helmet-async';

const ProjectView = ({ project }) => (
  <>
    <Helmet>
      <title>{project.name} - VideoPlanet</title>
      <meta name="description" content={project.description} />
      <meta property="og:title" content={project.name} />
      <meta property="og:url" content={`https://vlanet.net/projects/${project.id}`} />
    </Helmet>
    {/* 컴포넌트 내용 */}
  </>
);
```

#### B. 코드 스플리팅 개선
```javascript
// 라우트별 번들 최적화
const AdminDashboard = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/admin/Dashboard')
);

const ProjectRoutes = lazy(() => 
  import(/* webpackChunkName: "projects" */ './routes/ProjectRoutes')
);
```

### 4. 네비게이션 개선

#### A. 프로그래매틱 라우팅
```javascript
// 일관된 네비게이션 헬퍼
const navigation = {
  toProject: (id) => `/projects/${id}`,
  toProjectEdit: (id) => `/projects/${id}/edit`,
  toProjectFeedback: (id) => `/projects/${id}/feedback`,
  toAdmin: (section = '') => `/admin${section ? `/${section}` : ''}`,
};

// 사용
navigate(navigation.toProject(projectId));
```

#### B. Breadcrumb 구현
```javascript
const Breadcrumbs = () => {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);
  
  return (
    <nav className="breadcrumbs">
      <Link to="/">홈</Link>
      {paths.map((path, index) => (
        <Link key={path} to={`/${paths.slice(0, index + 1).join('/')}`}>
          {path}
        </Link>
      ))}
    </nav>
  );
};
```

### 5. 백엔드 최적화

#### A. API 버전 관리
```python
# urls.py
from django.urls import path, include

api_v1_patterns = [
    path('auth/', include('users.urls')),
    path('projects/', include('projects.urls')),
    # ...
]

urlpatterns = [
    path('api/v1/', include(api_v1_patterns)),
    path('api/v2/', include(api_v2_patterns)),  # 향후 버전
]
```

#### B. 에러 처리 통합
```python
# middleware.py
class ErrorHandlingMiddleware:
    def process_exception(self, request, exception):
        if request.path.startswith('/api/'):
            return JsonResponse({
                'error': str(exception),
                'status': 'error'
            }, status=self.get_status_code(exception))
        return None
```

### 6. 배포 설정 개선

#### A. 환경별 설정
```javascript
// config/environments.js
const environments = {
  development: {
    API_URL: 'http://localhost:8000',
    ENABLE_DEBUG: true,
  },
  staging: {
    API_URL: 'https://staging-api.vlanet.net',
    ENABLE_DEBUG: false,
  },
  production: {
    API_URL: 'https://api.vlanet.net',
    ENABLE_DEBUG: false,
  }
};
```

#### B. 헬스체크 개선
```javascript
// 프론트엔드 헬스체크
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: process.env.REACT_APP_VERSION,
    timestamp: new Date().toISOString()
  });
});
```

## 구현 우선순위

1. **즉시 구현 (긴급)**
   - Vercel rewrites 설정 수정
   - 404 페이지 구현
   - 레거시 URL 리다이렉트

2. **단기 구현 (1주일)**
   - 라우트 명명 규칙 통일
   - API 엔드포인트 정리
   - 에러 처리 개선

3. **중기 구현 (1개월)**
   - SEO 최적화
   - 코드 스플리팅 개선
   - 네비게이션 헬퍼 구현

4. **장기 구현 (3개월)**
   - API 버전 관리 시스템
   - 마이크로프론트엔드 도입 검토
   - 서버 사이드 렌더링 (SSR) 검토

## 예상 효과

1. **404 에러 완전 해결**
   - 모든 프론트엔드 경로에서 정상 작동
   - 사용자 경험 개선

2. **성능 향상**
   - 번들 크기 30% 감소
   - 초기 로딩 시간 단축

3. **유지보수성 개선**
   - 일관된 코드 구조
   - 명확한 라우팅 패턴

4. **SEO 개선**
   - 검색 엔진 크롤링 가능
   - 소셜 미디어 공유 최적화