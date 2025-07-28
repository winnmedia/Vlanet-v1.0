import json, logging, os
from django.conf import settings

logger = logging.getLogger(__name__)
from django.shortcuts import render
from django.http import JsonResponse
from django.views import View
from users.utils import user_validator
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from . import models
from projects import models as project_model

from django.db.models import F


@method_decorator(csrf_exempt, name='dispatch')
class FeedbackDetail(View):
    @user_validator
    def get(self, request, id):
        try:
            user = request.user
            email = user.username
            
            # Raw SQL로 필요한 필드만 가져오기
            from django.db import connection
            with connection.cursor() as cursor:
                # 프로젝트 정보 가져오기
                cursor.execute("""
                    SELECT p.id, p.name, p.manager, p.consumer, p.description,
                           p.user_id, p.created, p.updated, p.feedback_id,
                           u.username, u.nickname
                    FROM projects_project p
                    JOIN users_user u ON p.user_id = u.id
                    WHERE p.id = %s
                """, [id])
                
                row = cursor.fetchone()
                if not row:
                    return JsonResponse({"message": "잘못된 접근입니다."}, status=400)
                
                project_data = {
                    'id': row[0],
                    'name': row[1],
                    'manager': row[2],
                    'consumer': row[3],
                    'description': row[4],
                    'user_id': row[5],
                    'created': row[6],
                    'updated': row[7],
                    'feedback_id': row[8],
                    'owner_email': row[9],
                    'owner_nickname': row[10]
                }
                
                # 권한 확인
                cursor.execute("""
                    SELECT COUNT(*) FROM projects_members
                    WHERE project_id = %s AND user_id = %s
                """, [id, user.id])
                
                is_member = cursor.fetchone()[0] > 0
                if project_data['user_id'] != user.id and not is_member:
                    return JsonResponse({"message": "권한이 없습니다."}, status=403)
                
                # 피드백 정보 가져오기 (기본 필드만)
                feedback_file_url = None
                feedback_id = project_data['feedback_id']
                
                # 피드백이 없으면 생성
                if not feedback_id:
                    logging.info(f"Creating feedback for project {id}")
                    cursor.execute("""
                        INSERT INTO feedbacks_feedback (created, updated, files)
                        VALUES (NOW(), NOW(), NULL)
                        RETURNING id
                    """)
                    feedback_id = cursor.fetchone()[0]
                    
                    # 프로젝트에 피드백 연결
                    cursor.execute("""
                        UPDATE projects_project
                        SET feedback_id = %s
                        WHERE id = %s
                    """, [feedback_id, id])
                    logging.info(f"Created feedback {feedback_id} for project {id}")
                
                # 피드백 파일 정보 가져오기
                if feedback_id:
                    cursor.execute("""
                        SELECT id, files FROM feedbacks_feedback
                        WHERE id = %s
                    """, [feedback_id])
                    
                    feedback_row = cursor.fetchone()
                    if feedback_row and feedback_row[1]:
                        file_name = feedback_row[1]
                        
                        # 파일 경로 정규화
                        if file_name.startswith('/media/'):
                            # 이미 /media/로 시작하는 경우
                            file_path = file_name
                        elif file_name.startswith('feedback_file/'):
                            # feedback_file/로 시작하는 경우
                            file_path = f"/media/{file_name}"
                        elif file_name.startswith('/'):
                            # /로 시작하는 다른 경우
                            file_path = file_name
                        else:
                            # 상대 경로인 경우
                            file_path = f"/media/feedback_file/{file_name}"
                        
                        # URL 생성
                        if settings.DEBUG:
                            feedback_file_url = f"http://127.0.0.1:8000{file_path}"
                        else:
                            # 프로덕션에서는 HTTPS로 강제
                            host = request.get_host()
                            scheme = 'https' if not host.startswith('localhost') and not host.startswith('127.0.0.1') else 'http'
                            feedback_file_url = f"{scheme}://{host}{file_path}"
                        
                        logging.info(f"Feedback file URL constructed: {feedback_file_url}")
                
                # 멤버 리스트 가져오기
                cursor.execute("""
                    SELECT m.id, m.rating, u.username, u.nickname
                    FROM projects_members m
                    JOIN users_user u ON m.user_id = u.id
                    WHERE m.project_id = %s
                """, [id])
                
                member_list = []
                for member_row in cursor.fetchall():
                    member_list.append({
                        'id': member_row[0],
                        'rating': member_row[1],
                        'email': member_row[2],
                        'nickname': member_row[3]
                    })
                
                # 피드백 코멘트 가져오기
                feedback_comments = []
                if project_data['feedback_id']:
                    try:
                        # 먼저 새로운 컬럼이 있는지 확인
                        cursor.execute("""
                            SELECT column_name 
                            FROM information_schema.columns 
                            WHERE table_name = 'feedbacks_feedbackcomment' 
                            AND column_name IN ('display_mode', 'nickname')
                        """)
                        new_columns = [row[0] for row in cursor.fetchall()]
                        
                        # 쿼리 구성
                        if 'display_mode' in new_columns:
                            cursor.execute("""
                                SELECT c.id, c.security, c.title, c.section, c.text,
                                       u.username, u.nickname as user_nickname, c.created, 
                                       COALESCE(c.display_mode, 'anonymous') as display_mode, 
                                       c.nickname as custom_nickname,
                                       c.is_important, c.parent_id,
                                       (SELECT COUNT(*) FROM feedbacks_feedbackreaction 
                                        WHERE comment_id = c.id AND reaction = 'like') as like_count,
                                       (SELECT COUNT(*) FROM feedbacks_feedbackreaction 
                                        WHERE comment_id = c.id AND reaction = 'dislike') as dislike_count,
                                       (SELECT reaction FROM feedbacks_feedbackreaction 
                                        WHERE comment_id = c.id AND user_id = %s) as user_reaction,
                                       CONCAT(u.first_name, ' ', u.last_name) as full_name
                                FROM feedbacks_feedbackcomment c
                                JOIN users_user u ON c.user_id = u.id
                                WHERE c.feedback_id = %s AND c.parent_id IS NULL
                                ORDER BY c.created DESC
                            """, [user.id, project_data['feedback_id']])
                            
                            for comment_row in cursor.fetchall():
                                display_mode = comment_row[8] if comment_row[8] else 'anonymous'
                                custom_nickname = comment_row[9]
                                is_important = comment_row[10] if len(comment_row) > 10 else False
                                like_count = comment_row[12] if len(comment_row) > 12 else 0
                                dislike_count = comment_row[13] if len(comment_row) > 13 else 0
                                user_reaction = comment_row[14] if len(comment_row) > 14 else None
                                full_name = comment_row[15] if len(comment_row) > 15 else None
                                
                                # 표시할 이름 결정
                                if display_mode == 'anonymous' or comment_row[1]:  # security가 True면 익명
                                    display_name = '익명'
                                    display_email = None
                                elif display_mode == 'nickname' and custom_nickname:
                                    display_name = custom_nickname
                                    display_email = None
                                else:  # realname 모드
                                    # full_name이 빈 문자열이거나 공백만 있는 경우 처리
                                    if full_name and full_name.strip():
                                        display_name = full_name.strip()
                                    else:
                                        # 실명이 없으면 username 사용
                                        display_name = comment_row[5]  # username
                                    display_email = None
                                
                                comment_data = {
                                    'id': comment_row[0],
                                    'security': comment_row[1],
                                    'title': comment_row[2],
                                    'section': comment_row[3],
                                    'text': comment_row[4],
                                    'email': comment_row[5],
                                    'nickname': display_name,
                                    'created': comment_row[7],
                                    'display_mode': display_mode,
                                    'custom_nickname': custom_nickname,
                                    'display_email': display_email,
                                    'is_important': is_important,
                                    'like_count': like_count,
                                    'dislike_count': dislike_count,
                                    'user_reaction': user_reaction
                                }
                                
                                # 답글 가져오기
                                cursor.execute("""
                                    SELECT c.id, c.text, u.username, u.nickname, c.created,
                                           c.display_mode, c.nickname as custom_nickname,
                                           CONCAT(u.first_name, ' ', u.last_name) as full_name
                                    FROM feedbacks_feedbackcomment c
                                    JOIN users_user u ON c.user_id = u.id
                                    WHERE c.parent_id = %s
                                    ORDER BY c.created ASC
                                """, [comment_row[0]])
                                
                                comment_data['replies'] = []
                                for reply_row in cursor.fetchall():
                                    reply_display_mode = reply_row[5] if reply_row[5] else 'anonymous'
                                    reply_custom_nickname = reply_row[6]
                                    reply_full_name = reply_row[7] if len(reply_row) > 7 else None
                                    
                                    # 답글 표시 이름 결정
                                    if reply_display_mode == 'anonymous':
                                        reply_display_name = '익명'
                                    elif reply_display_mode == 'nickname' and reply_custom_nickname:
                                        reply_display_name = reply_custom_nickname
                                    else:
                                        # realname 모드
                                        if reply_full_name and reply_full_name.strip():
                                            reply_display_name = reply_full_name.strip()
                                        else:
                                            # 실명이 없으면 username 사용
                                            reply_display_name = reply_row[2]
                                    
                                    comment_data['replies'].append({
                                        'id': reply_row[0],
                                        'text': reply_row[1],
                                        'username': reply_row[2],
                                        'nickname': reply_display_name,
                                        'created': reply_row[4],
                                        'display_mode': reply_display_mode,
                                        'custom_nickname': reply_custom_nickname
                                    })
                                
                                feedback_comments.append(comment_data)
                        else:
                            # 구 버전 호환
                            cursor.execute("""
                                SELECT c.id, c.security, c.title, c.section, c.text,
                                       u.username, u.nickname, c.created
                                FROM feedbacks_feedbackcomment c
                                JOIN users_user u ON c.user_id = u.id
                                WHERE c.feedback_id = %s
                                ORDER BY c.created DESC
                            """, [project_data['feedback_id']])
                            
                            for comment_row in cursor.fetchall():
                                feedback_comments.append({
                                    'id': comment_row[0],
                                    'security': comment_row[1],
                                    'title': comment_row[2],
                                    'section': comment_row[3],
                                    'text': comment_row[4],
                                    'email': comment_row[5],
                                    'nickname': comment_row[6],
                                    'created': comment_row[7]
                                })
                    except Exception as e:
                        logger.error(f"Error fetching feedback comments: {str(e)}")
                        # 기본 쿼리로 폴백
                        cursor.execute("""
                            SELECT c.id, c.security, c.title, c.section, c.text,
                                   u.username, u.nickname, c.created
                            FROM feedbacks_feedbackcomment c
                            JOIN users_user u ON c.user_id = u.id
                            WHERE c.feedback_id = %s
                            ORDER BY c.created DESC
                        """, [project_data['feedback_id']])
                        
                        for comment_row in cursor.fetchall():
                            feedback_comments.append({
                                'id': comment_row[0],
                                'security': comment_row[1],
                                'title': comment_row[2],
                                'section': comment_row[3],
                                'text': comment_row[4],
                                'email': comment_row[5],
                                'nickname': comment_row[6],
                                'created': comment_row[7]
                            })
            
            result = {
                "id": project_data['id'],
                "name": project_data['name'],
                "manager": project_data['manager'],
                "consumer": project_data['consumer'],
                "description": project_data['description'],
                "owner_nickname": project_data['owner_nickname'],
                "owner_email": project_data['owner_email'],
                "created": project_data['created'],
                "updated": project_data['updated'],
                "member_list": member_list,
                "files": feedback_file_url,
                "feedback": feedback_comments
            }
            
            return JsonResponse({"result": result}, status=200)
        except Exception as e:
            logger.error(f"Error in feedback operation: {str(e)}", exc_info=True)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)

    @user_validator
    def put(self, request, id):
        try:
            user = request.user
            email = user.username
            data = json.loads(request.body)

            secret = data.get("secret")
            if secret == "false":
                secret = False
            else:
                secret = True

            title = data.get("title")
            section = data.get("section")
            contents = data.get("contents")

            project = project_model.Project.objects.get_or_none(id=id)
            if not project:
                return JsonResponse({"message": "존재하지 않는 프로젝트입니다."}, status=404)

            # 권한 확인을 먼저 수행
            members = project.members.all().filter(user__username=email)
            if project.user.username != email and not members.exists():
                return JsonResponse({"message": "권한이 없습니다."}, status=403)

            feedback = project.feedback
            if not feedback:
                # 피드백이 없으면 자동으로 생성
                logging.info(f"Creating feedback for project {id} in PUT method")
                feedback = models.FeedBack.objects.create()
                project.feedback = feedback
                project.save()
                logging.info(f"Created feedback {feedback.id} for project {id}")

            # display_mode와 nickname 추가 처리
            display_mode = data.get("display_mode", "anonymous")
            nickname = data.get("nickname", "")
            
            # 코멘트 타입 처리 (코멘트 탭에서 사용)
            comment_type = data.get("comment_type")
            comment_field = data.get("comment")
            
            # comment 필드가 있으면 contents로 사용
            if comment_field and not contents:
                contents = comment_field
            
            # display_mode가 nickname인 경우 처리
            if display_mode == "nickname":
                if not nickname:
                    # 사용자의 기본 닉네임 사용
                    if user.nickname:
                        nickname = user.nickname
                    else:
                        # 닉네임이 없으면 자동 생성
                        import random
                        random_suffix = random.randint(1000, 9999)
                        nickname = f"익명사용자_{random_suffix}"
            
            # 타입 필드 처리
            feed_type = data.get("type", "feedback")
            
            models.FeedBackComment.objects.create(
                feedback=feedback,
                user=user,
                security=secret,
                display_mode=display_mode,
                nickname=nickname if display_mode == "nickname" else None,
                title=title,
                section=section,
                text=contents,
            )
            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            logger.error(f"Error in feedback operation: {str(e)}", exc_info=True)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)

    @user_validator
    def delete(self, request, id):
        try:
            user = request.user

            feedback_comment = models.FeedBackComment.objects.get_or_none(id=id)

            if not feedback_comment:
                return JsonResponse({"message": "잘못된 요청입니다."}, status=400)

            if feedback_comment.user != user:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)

            feedback_comment.delete()

            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            logger.error(f"Error in feedback operation: {str(e)}", exc_info=True)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)

    @user_validator
    def post(self, request, id):
        try:
            logging.info(f"File upload request for project {id}")
            logging.info(f"Request FILES: {request.FILES}")
            logging.info(f"Request method: {request.method}")
            logging.info(f"Content type: {request.content_type}")
            
            user = request.user
            email = user.username

            project = project_model.Project.objects.get_or_none(id=id)
            if not project:
                logging.error(f"Project {id} not found")
                return JsonResponse({"message": "잘못된 접근입니다."}, status=400)
            
            feedback = project.feedback
            if not feedback:
                return JsonResponse({"message": "피드백이 생성되지 않았습니다."}, status=400)

            members = project.members.all().filter(user__username=email)
            if project.user.username != email and not members.exists():
                logging.error(f"User {email} has no permission for project {id}")
                return JsonResponse({"message": "권한이 없습니다."}, status=403)

            if not request.FILES:
                logging.error("No files in request")
                return JsonResponse({"message": "파일이 없습니다."}, status=400)
                
            files = request.FILES.getlist("files")
            if not files:
                logging.error("No files found with key 'files'")
                return JsonResponse({"message": "파일이 없습니다."}, status=400)
                
            files = files[0]
            logging.info(f"File name: {files.name}, size: {files.size}")

            import uuid
            from django.core.files import File

            try:
                # 파일 유효성 검사
                if files.size == 0:
                    return JsonResponse({"message": "비어있는 파일입니다."}, status=400)
                
                # 파일 크기 검사
                max_size = 600 * 1024 * 1024  # 600MB
                if files.size > max_size:
                    size_mb = files.size / (1024 * 1024)
                    return JsonResponse({"message": f"파일 크기가 너무 큽니다. (현재: {size_mb:.1f}MB, 최대: 600MB)"}, status=413)
                
                # 파일 형식 검사
                allowed_extensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
                import os
                original_name = files.name
                name, ext = os.path.splitext(original_name.lower())
                
                if ext not in allowed_extensions:
                    return JsonResponse({"message": f"지원하지 않는 파일 형식입니다. ({', '.join(allowed_extensions)} 형식만 가능)"}, status=400)
                
                logging.info(f"Processing upload: {original_name}, size: {files.size / (1024*1024):.1f}MB")
                
                # 파일명 안전하게 변환
                from django.utils.text import slugify
                import uuid
                import re
                
                # 한글이 포함된 경우 처리
                if re.search(r'[가-힣]', name):
                    # 프로젝트 ID와 타임스탬프를 사용한 고유한 파일명 생성
                    import time
                    timestamp = int(time.time())
                    safe_name = f"project_{project.id}_video_{timestamp}_{uuid.uuid4().hex[:8]}"
                    logging.info(f"Korean filename detected, converting '{original_name}' to '{safe_name}{ext}'")
                else:
                    # 영문 파일명은 slugify 처리
                    safe_name = slugify(name, allow_unicode=False)
                    if not safe_name or safe_name == 'mp4' or safe_name == 'video':
                        safe_name = f"video_{uuid.uuid4().hex[:8]}"
                
                # 특수문자 제거 및 공백을 언더스코어로 변환
                safe_name = re.sub(r'[^\w\-_]', '_', safe_name)
                safe_name = re.sub(r'_+', '_', safe_name)  # 연속된 언더스코어 제거
                safe_name = safe_name.strip('_')  # 앞뒤 언더스코어 제거
                
                files.name = f"{safe_name}{ext}"
                
                # 파일 저장
                logging.info(f"Saving file with safe name: {files.name} (original: {original_name}, size: {files.size} bytes)")
                logging.info(f"Feedback object before save: id={feedback.id}, files={getattr(feedback, 'files', None)}")
                feedback.files = files
                feedback.save()
                logging.info(f"Feedback object after save: id={feedback.id}, files={feedback.files}")
                logging.info(f"File field value: {feedback.files.name}")
                logging.info(f"File saved successfully at: {feedback.files.path}")
                
                # 비디오 파일인 경우 인코딩 작업 시작 (임시 비활성화)
                try:
                    if hasattr(feedback, 'is_video') and feedback.is_video:
                        try:
                            # Celery가 설치될 때까지 인코딩 비활성화
                            logging.info(f"Video encoding disabled temporarily for feedback {feedback.id}")
                            if hasattr(feedback, 'encoding_status'):
                                feedback.encoding_status = 'none'
                                feedback.save()
                        except Exception as meta_error:
                            logging.error(f"Error processing video: {str(meta_error)}")
                except AttributeError:
                    pass
                
                # Get the file URL
                file_url = None
                if feedback.files:
                    file_path = feedback.files.url
                    
                    # URL 생성 (조회 시와 동일한 로직)
                    if settings.DEBUG:
                        file_url = f"http://127.0.0.1:8000{file_path}"
                    else:
                        # 프로덕션에서는 HTTPS로 강제
                        host = request.get_host()
                        scheme = 'https' if not host.startswith('localhost') and not host.startswith('127.0.0.1') else 'http'
                        file_url = f"{scheme}://{host}{file_path}"
                    
                    logging.info(f"Upload - File URL: {file_url}")
                    logging.info(f"Upload - File path: {file_path}")
                    logging.info(f"Upload - File name: {feedback.files.name}")
                
                response_data = {
                    "message": "파일이 성공적으로 업로드되었습니다.",
                    "result": "success",
                    "file_url": file_url,
                    "file_name": feedback.files.name if feedback.files else None
                }
                
                # 비디오인 경우 인코딩 상태 추가
                try:
                    if hasattr(feedback, 'is_video') and feedback.is_video:
                        video_data = {"encoding_status": getattr(feedback, 'encoding_status', 'none')}
                        video_metadata = {}
                        if hasattr(feedback, 'duration'):
                            video_metadata["duration"] = feedback.duration
                        if hasattr(feedback, 'width'):
                            video_metadata["width"] = feedback.width
                        if hasattr(feedback, 'height'):
                            video_metadata["height"] = feedback.height
                        if hasattr(feedback, 'file_size'):
                            video_metadata["file_size"] = feedback.file_size
                        if video_metadata:
                            video_data["video_metadata"] = video_metadata
                        response_data.update(video_data)
                except AttributeError:
                    pass
                
                return JsonResponse(response_data, status=200)
            except Exception as upload_error:
                logging.error(f"Error during file processing: {str(upload_error)}")
                return JsonResponse({"message": f"파일 처리 중 오류: {str(upload_error)}"}, status=500)
        except Exception as e:
            logger.error(f"Error in feedback operation: {str(e)}", exc_info=True)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class FeedbackFileDelete(View):
    @user_validator
    def delete(self, request, id):
        try:
            user = request.user
            email = user.username

            project = project_model.Project.objects.get_or_none(id=id)
            if not project:
                return JsonResponse({"message": "잘못된 접근입니다."}, status=400)
            
            # 피드백 안전하게 가져오기
            try:
                # 필요한 필드만 선택
                feedback = feedback_model.FeedBack.objects.filter(
                    projects=project
                ).only('id', 'files', 'created', 'updated').first()
            except Exception:
                # 실패 시 관계를 통해 가져오기
                feedback = project.feedback
            
            if not feedback:
                return JsonResponse({"message": "피드백이 생성되지 않았습니다."}, status=400)

            members = project.members.all().filter(user__username=email)
            if project.user.username != email and not members.exists():
                return JsonResponse({"message": "권한이 없습니다."}, status=403)

            feedback.files = None
            feedback.save()
            return JsonResponse({"result": "result"}, status=200)
        except Exception as e:
            logger.error(f"Error in feedback operation: {str(e)}", exc_info=True)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class VideoEncodingStatus(View):
    """Check video encoding status"""
    @user_validator
    def get(self, request, id):
        try:
            user = request.user
            email = user.username

            project = project_model.Project.objects.get_or_none(id=id)
            if not project:
                return JsonResponse({"message": "잘못된 접근입니다."}, status=400)
            
            # 피드백 안전하게 가져오기
            try:
                # 필요한 필드만 선택
                feedback = feedback_model.FeedBack.objects.filter(
                    projects=project
                ).only('id', 'files', 'created', 'updated').first()
            except Exception:
                # 실패 시 관계를 통해 가져오기
                feedback = project.feedback
            
            if not feedback:
                return JsonResponse({"message": "피드백이 생성되지 않았습니다."}, status=400)

            members = project.members.all().filter(user__username=email)
            if project.user.username != email and not members.exists():
                return JsonResponse({"message": "권한이 없습니다."}, status=403)

            response_data = {
                "encoding_status": getattr(feedback, 'encoding_status', 'none'),
                "has_original": bool(feedback.files),
                "has_web_version": bool(getattr(feedback, 'video_file_web', None)),
                "has_thumbnail": bool(getattr(feedback, 'thumbnail', None)),
                "has_hls": bool(getattr(feedback, 'hls_playlist_url', None)),
            }

            # Add URLs for encoded versions if available
            if hasattr(feedback, 'video_file_web') and feedback.video_file_web:
                response_data["web_video_url"] = feedback.video_file_web.url
            
            if hasattr(feedback, 'thumbnail') and feedback.thumbnail:
                response_data["thumbnail_url"] = feedback.thumbnail.url
            
            if hasattr(feedback, 'hls_playlist_url') and feedback.hls_playlist_url:
                response_data["hls_url"] = feedback.hls_playlist_url

            # Add quality versions if available
            quality_versions = []
            for quality in ['high', 'medium', 'low']:
                field_name = f'video_file_{quality}'
                if hasattr(feedback, field_name) and getattr(feedback, field_name):
                    quality_versions.append({
                        "quality": quality,
                        "path": getattr(feedback, field_name)
                    })
            
            if quality_versions:
                response_data["quality_versions"] = quality_versions

            return JsonResponse(response_data, status=200)
            
        except Exception as e:
            logger.error(f"Error in feedback operation: {str(e)}", exc_info=True)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)
