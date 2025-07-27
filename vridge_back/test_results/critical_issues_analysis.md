# VideoPlanet 심각한 이슈 상세 분석

## 1. 영상 업로드 405 에러 - 근본 원인 분석

### 현재 상태
- **문제**: 영상 업로드 시 405 Method Not Allowed 에러 발생
- **원인**: 업로드 엔드포인트가 전혀 구현되지 않음

### 코드 분석 결과

#### `/feedbacks/urls.py` 
```python
# 현재 URL 패턴에 upload 관련 경로 없음
urlpatterns = [
    path("<int:id>", views.FeedbackDetail.as_view()),
    path("file/<int:id>", views.FeedbackFileDelete.as_view()),
    # ... upload 엔드포인트 누락
]
```

#### `/feedbacks/views.py`
- `upload` 관련 뷰 함수나 클래스 없음
- `FeedbackFileDelete`는 있지만 업로드는 없음

### 즉시 필요한 구현 사항

```python
# feedbacks/urls.py에 추가
path("upload/", views.FeedbackUpload.as_view()),

# feedbacks/views.py에 추가
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class FeedbackUpload(APIView):
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        try:
            video_file = request.FILES.get('video')
            if not video_file:
                return Response(
                    {"error": "비디오 파일이 필요합니다."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 파일 크기 검증 (예: 500MB)
            if video_file.size > 500 * 1024 * 1024:
                return Response(
                    {"error": "파일 크기는 500MB를 초과할 수 없습니다."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 파일 타입 검증
            allowed_types = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo']
            if video_file.content_type not in allowed_types:
                return Response(
                    {"error": "지원하지 않는 비디오 형식입니다."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Feedback 모델에 저장
            feedback = Feedback.objects.create(
                title=request.data.get('title', '제목 없음'),
                project_id=request.data.get('project_id'),
                file=video_file,
                user=request.user
            )
            
            # 비디오 인코딩 작업 큐에 추가
            if hasattr(feedback, 'start_encoding'):
                feedback.start_encoding()
            
            serializer = FeedbackSerializer(feedback)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

## 2. 보안 취약점 분석

### 파일 업로드 보안 체크리스트
1. **파일 크기 제한**: ❌ 미구현
2. **파일 타입 검증**: ❌ 미구현
3. **파일명 새니타이징**: ❌ 미구현
4. **바이러스 스캔**: ❌ 미구현
5. **업로드 경로 격리**: ⚠️ 부분 구현

### 권장 보안 강화 사항
```python
import os
import hashlib
from django.core.files.storage import default_storage
from django.conf import settings

def sanitize_filename(filename):
    """파일명 안전하게 변환"""
    name, ext = os.path.splitext(filename)
    # 특수문자 제거
    name = re.sub(r'[^\w\s-]', '', name).strip()
    # 공백을 언더스코어로
    name = re.sub(r'[-\s]+', '_', name)
    # 해시 추가로 중복 방지
    hash_suffix = hashlib.md5(f"{name}{timezone.now()}".encode()).hexdigest()[:8]
    return f"{name}_{hash_suffix}{ext}"

def validate_video_file(file):
    """비디오 파일 유효성 검사"""
    # 매직 넘버로 실제 파일 타입 확인
    file.seek(0)
    header = file.read(12)
    file.seek(0)
    
    # MP4 시그니처 확인
    if header[4:8] == b'ftyp':
        return True
    # AVI 시그니처 확인  
    elif header[:4] == b'RIFF' and header[8:12] == b'AVI ':
        return True
    # MOV 시그니처 확인
    elif header[4:8] == b'ftyp' and header[8:12] in [b'qt  ', b'moov']:
        return True
        
    return False
```

## 3. 성능 최적화 필요 사항

### 대용량 비디오 처리
현재 구현에서 누락된 중요 기능:

1. **청크 업로드**: 대용량 파일을 작은 조각으로 나누어 업로드
2. **진행률 표시**: 업로드 진행 상황 실시간 피드백
3. **재개 가능 업로드**: 네트워크 끊김 시 이어서 업로드
4. **비동기 인코딩**: 업로드 후 백그라운드에서 인코딩

### 구현 예시
```python
# models.py
class VideoChunk(models.Model):
    upload_id = models.CharField(max_length=255)
    chunk_number = models.IntegerField()
    chunk_data = models.BinaryField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['upload_id', 'chunk_number']

# views.py
class ChunkedUploadView(APIView):
    def post(self, request):
        upload_id = request.data.get('upload_id')
        chunk_number = request.data.get('chunk_number')
        total_chunks = request.data.get('total_chunks')
        chunk_data = request.FILES.get('chunk')
        
        # 청크 저장
        VideoChunk.objects.create(
            upload_id=upload_id,
            chunk_number=chunk_number,
            chunk_data=chunk_data.read()
        )
        
        # 모든 청크가 업로드되었는지 확인
        uploaded_chunks = VideoChunk.objects.filter(
            upload_id=upload_id
        ).count()
        
        if uploaded_chunks == total_chunks:
            # 청크들을 하나의 파일로 병합
            merge_chunks.delay(upload_id)  # Celery 태스크
            
        return Response({
            'uploaded': uploaded_chunks,
            'total': total_chunks
        })
```

## 4. 프론트엔드 통합 이슈

### 현재 프론트엔드 업로드 코드 분석 필요
```javascript
// 예상되는 프론트엔드 코드
const uploadVideo = async (file, projectId) => {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('project_id', projectId);
  formData.append('title', file.name);
  
  try {
    const response = await axios.post('/api/feedbacks/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        // 진행률 업데이트
      }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 405) {
      console.error('업로드 엔드포인트가 구현되지 않음');
    }
    throw error;
  }
};
```

## 5. 데이터베이스 스키마 검증

### Feedback 모델 파일 필드 확인 필요
```python
# models.py에서 확인 필요
class Feedback(models.Model):
    file = models.FileField(
        upload_to='feedback_videos/%Y/%m/%d/',
        validators=[FileExtensionValidator(allowed_extensions=['mp4', 'avi', 'mov', 'wmv'])]
    )
    encoding_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', '대기중'),
            ('processing', '처리중'),
            ('completed', '완료'),
            ('failed', '실패')
        ],
        default='pending'
    )
    file_size = models.BigIntegerField(null=True, blank=True)
    duration = models.IntegerField(null=True, blank=True)  # 초 단위
    resolution = models.CharField(max_length=20, null=True, blank=True)  # 예: "1920x1080"
```

## 결론

영상 업로드 기능의 완전한 부재는 시스템의 핵심 기능을 마비시키는 심각한 문제입니다. 즉시 다음 작업이 필요합니다:

1. **24시간 내**: 기본 업로드 엔드포인트 구현
2. **48시간 내**: 보안 검증 및 에러 처리 추가
3. **1주일 내**: 청크 업로드 및 진행률 표시 구현
4. **2주일 내**: 비동기 인코딩 파이프라인 구축

이 문제가 해결되지 않으면 프로덕션 배포는 불가능합니다.