# -*- coding: utf-8 -*-
"""
프로필 이미지 및 추가 정보 업로드 관련 뷰
"""
import json
import logging
import os
from django.views import View
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings
from .utils import user_validator
from PIL import Image

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class ProfileImageUpload(View):
    """프로필 이미지 업로드"""
    
    @user_validator
    def post(self, request):
        """프로필 이미지 업로드 및 업데이트"""
        try:
            user = request.user
            
            if 'profile_image' not in request.FILES:
                return JsonResponse({
                    "message": "프로필 이미지를 선택해주세요."
                }, status=400)
            
            profile_image = request.FILES['profile_image']
            
            # 파일 크기 제한 (5MB)
            if profile_image.size > 5 * 1024 * 1024:
                return JsonResponse({
                    "message": "이미지 크기는 5MB를 초과할 수 없습니다."
                }, status=400)
            
            # 이미지 파일 형식 확인
            allowed_formats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
            if profile_image.content_type not in allowed_formats:
                return JsonResponse({
                    "message": "JPG, PNG, GIF 형식의 이미지만 업로드 가능합니다."
                }, status=400)
            
            # 기존 프로필 이미지가 있다면 삭제
            if user.profile_image:
                old_image_path = user.profile_image.path
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)
            
            # 이미지 저장
            user.profile_image = profile_image
            user.save()
            
            # 이미지 리사이징 (선택사항)
            self._resize_image(user.profile_image.path)
            
            return JsonResponse({
                "status": "success",
                "message": "프로필 이미지가 성공적으로 업로드되었습니다.",
                "profile_image_url": user.profile_image.url
            }, status=200)
            
        except Exception as e:
            logger.error(f"Profile image upload error: {str(e)}")
            return JsonResponse({
                "message": "프로필 이미지 업로드 중 오류가 발생했습니다."
            }, status=500)
    
    def _resize_image(self, image_path, max_size=(400, 400)):
        """이미지 리사이징"""
        try:
            with Image.open(image_path) as img:
                # EXIF 회전 정보 처리
                img = self._fix_image_rotation(img)
                
                # 비율 유지하며 리사이징
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # RGB로 변환 (PNG의 경우 RGBA일 수 있음)
                if img.mode != 'RGB':
                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'RGBA':
                        rgb_img.paste(img, mask=img.split()[3])
                    else:
                        rgb_img.paste(img)
                    img = rgb_img
                
                # 저장
                img.save(image_path, 'JPEG', quality=90, optimize=True)
        except Exception as e:
            logger.error(f"Image resize error: {str(e)}")
    
    def _fix_image_rotation(self, img):
        """EXIF 데이터를 기반으로 이미지 회전 수정"""
        try:
            exif = img._getexif()
            if exif:
                orientation = exif.get(0x0112)
                if orientation:
                    rotations = {
                        3: 180,
                        6: 270,
                        8: 90
                    }
                    if orientation in rotations:
                        img = img.rotate(rotations[orientation], expand=True)
        except:
            pass
        return img
    
    @user_validator
    def delete(self, request):
        """프로필 이미지 삭제"""
        try:
            user = request.user
            
            if not user.profile_image:
                return JsonResponse({
                    "message": "삭제할 프로필 이미지가 없습니다."
                }, status=400)
            
            # 이미지 파일 삭제
            if os.path.exists(user.profile_image.path):
                os.remove(user.profile_image.path)
            
            # DB에서 이미지 필드 초기화
            user.profile_image = None
            user.save()
            
            return JsonResponse({
                "status": "success",
                "message": "프로필 이미지가 삭제되었습니다."
            }, status=200)
            
        except Exception as e:
            logger.error(f"Profile image delete error: {str(e)}")
            return JsonResponse({
                "message": "프로필 이미지 삭제 중 오류가 발생했습니다."
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ProfileUpdate(View):
    """프로필 추가 정보 업데이트"""
    
    @user_validator
    def post(self, request):
        """프로필 정보 업데이트"""
        try:
            user = request.user
            data = json.loads(request.body)
            
            # 업데이트 가능한 필드들
            updatable_fields = ['nickname', 'bio', 'phone', 'company', 'position']
            updated_fields = []
            
            for field in updatable_fields:
                if field in data:
                    value = data[field].strip() if isinstance(data[field], str) else data[field]
                    
                    # 필드별 검증
                    if field == 'nickname':
                        if len(value) < 2:
                            return JsonResponse({
                                "message": "닉네임은 최소 2자 이상이어야 합니다."
                            }, status=400)
                        
                        # 닉네임 중복 확인
                        from . import models
                        existing_user = models.User.objects.filter(
                            nickname=value
                        ).exclude(id=user.id).first()
                        
                        if existing_user:
                            return JsonResponse({
                                "message": "이미 사용 중인 닉네임입니다."
                            }, status=409)
                    
                    elif field == 'bio' and len(value) > 500:
                        return JsonResponse({
                            "message": "자기소개는 500자를 초과할 수 없습니다."
                        }, status=400)
                    
                    elif field == 'phone':
                        # 전화번호 형식 검증 (선택사항)
                        import re
                        if value and not re.match(r'^[\d\-\+\s\(\)]+$', value):
                            return JsonResponse({
                                "message": "올바른 전화번호 형식이 아닙니다."
                            }, status=400)
                    
                    setattr(user, field, value)
                    updated_fields.append(field)
            
            if updated_fields:
                user.save()
                
                # 업데이트된 프로필 정보 반환
                profile_data = {
                    "email": user.username,
                    "nickname": user.nickname,
                    "bio": user.bio,
                    "phone": user.phone,
                    "company": user.company,
                    "position": user.position,
                    "profile_image": user.profile_image.url if user.profile_image else None,
                }
                
                return JsonResponse({
                    "status": "success",
                    "message": "프로필이 성공적으로 업데이트되었습니다.",
                    "updated_fields": updated_fields,
                    "profile": profile_data
                }, status=200)
            else:
                return JsonResponse({
                    "message": "업데이트할 정보를 입력해주세요."
                }, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({
                "message": "잘못된 요청 형식입니다."
            }, status=400)
        except Exception as e:
            logger.error(f"Profile update error: {str(e)}")
            return JsonResponse({
                "message": "프로필 업데이트 중 오류가 발생했습니다."
            }, status=500)