from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .models import UserProfile
from .utils import user_validator
import os
import uuid
import json


@method_decorator(csrf_exempt, name='dispatch')
class ProfileImageUpload(View):
    """프로필 이미지 업로드/삭제"""

    @user_validator
    def post(self, request):
        """프로필 이미지 업로드"""
        try:
            profile_image = request.FILES.get('profile_image')
            
            if not profile_image:
                return JsonResponse({
                    'status': 'error',
                    'message': '이미지 파일이 없습니다.'
                }, status=400)
            
            # 파일 크기 체크 (5MB)
            if profile_image.size > 5 * 1024 * 1024:
                return JsonResponse({
                    'status': 'error',
                    'message': '이미지 크기는 5MB를 초과할 수 없습니다.'
                }, status=400)
            
            # 파일 타입 체크
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
            if profile_image.content_type not in allowed_types:
                return JsonResponse({
                    'status': 'error',
                    'message': '지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WEBP만 가능)'
                }, status=400)
            
            # UserProfile 가져오거나 생성
            profile, created = UserProfile.objects.get_or_create(user=request.user)
            
            # 기존 이미지가 있으면 삭제
            if profile.profile_image:
                try:
                    profile.profile_image.delete(save=False)
                except:
                    pass
            
            # 새 파일명 생성
            ext = profile_image.name.split('.')[-1]
            filename = f"profile_{request.user.id}_{uuid.uuid4().hex[:8]}.{ext}"
            
            # 이미지 저장
            profile.profile_image.save(filename, profile_image, save=True)
            
            # 이미지 URL 생성
            image_url = profile.profile_image.url if profile.profile_image else None
            
            return JsonResponse({
                'status': 'success',
                'message': '프로필 이미지가 업로드되었습니다.',
                'profile_image_url': image_url
            }, status=200)
            
        except Exception as e:
            print(f"Profile image upload error: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': f'이미지 업로드 중 오류가 발생했습니다: {str(e)}'
            }, status=500)
    
    @user_validator
    def delete(self, request):
        """프로필 이미지 삭제"""
        try:
            profile = UserProfile.objects.filter(user=request.user).first()
            
            if profile and profile.profile_image:
                # 이미지 파일 삭제
                profile.profile_image.delete(save=True)
                
                return JsonResponse({
                    'status': 'success',
                    'message': '프로필 이미지가 삭제되었습니다.'
                }, status=200)
            else:
                return JsonResponse({
                    'status': 'error',
                    'message': '삭제할 프로필 이미지가 없습니다.'
                }, status=404)
                
        except Exception as e:
            print(f"Profile image delete error: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': f'이미지 삭제 중 오류가 발생했습니다: {str(e)}'
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ProfileUpdate(View):
    """프로필 정보 업데이트"""
    
    @user_validator
    def post(self, request):
        """프로필 정보 업데이트"""
        return self.update_profile(request)
    
    @user_validator
    def patch(self, request):
        """프로필 정보 업데이트 (PATCH 메서드 지원)"""
        return self.update_profile(request)
    
    def update_profile(self, request):
        """실제 프로필 업데이트 로직"""
        try:
            # JSON 데이터 파싱
            try:
                data = json.loads(request.body)
            except:
                data = request.POST.dict()
            
            # UserProfile 가져오거나 생성
            profile, created = UserProfile.objects.get_or_create(user=request.user)
            
            # 업데이트할 필드들
            fields_to_update = ['bio', 'phone', 'company', 'position']
            
            for field in fields_to_update:
                if field in data:
                    setattr(profile, field, data[field])
            
            # 닉네임은 User 모델에 있음
            if 'nickname' in data:
                request.user.nickname = data['nickname']
                request.user.save()
            
            profile.save()
            
            # 응답 데이터 구성
            response_data = {
                'status': 'success',
                'message': '프로필이 업데이트되었습니다.',
                'profile': {
                    'nickname': request.user.nickname,
                    'bio': profile.bio,
                    'phone': profile.phone,
                    'company': profile.company,
                    'position': profile.position,
                    'profile_image': profile.profile_image.url if profile.profile_image else None
                }
            }
            
            return JsonResponse(response_data, status=200)
            
        except Exception as e:
            print(f"Profile update error: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': f'프로필 업데이트 중 오류가 발생했습니다: {str(e)}'
            }, status=500)