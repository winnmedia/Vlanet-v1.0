"""
프로젝트 관련 유틸리티
트랜잭션 관리 및 데이터 무결성 보장
"""
import logging
from django.db import transaction, IntegrityError
from django.utils import timezone
from . import models

logger = logging.getLogger(__name__)


class ProjectCreationError(Exception):
    """프로젝트 생성 중 발생하는 에러"""
    pass


def create_project_atomic(user, project_data, processes):
    """
    원자적 프로젝트 생성
    모든 관련 데이터를 하나의 트랜잭션으로 처리
    """
    with transaction.atomic():
        # 트랜잭션 내에서 SELECT FOR UPDATE로 동시성 제어
        user_locked = models.User.objects.select_for_update().get(pk=user.pk)
        
        # 중복 프로젝트 체크 (트랜잭션 내에서)
        duplicate_check = models.Project.objects.filter(
            user=user_locked,
            name=project_data['name'],
            created__gte=timezone.now() - timezone.timedelta(seconds=30)
        ).exists()
        
        if duplicate_check:
            raise ProjectCreationError(
                "동일한 이름의 프로젝트가 최근에 생성되었습니다."
            )
        
        try:
            # 프로젝트 생성
            project = models.Project.objects.create(
                user=user_locked,
                name=project_data['name'],
                manager=project_data.get('manager', ''),
                consumer=project_data.get('consumer', ''),
                description=project_data.get('description', ''),
                color=project_data.get('color', '#1631F8'),
                tone_manner=project_data.get('tone_manner', ''),
                genre=project_data.get('genre', ''),
                concept=project_data.get('concept', '')
            )
            
            # 프로세스 생성
            for process_data in processes:
                models.Process.objects.create(
                    project=project,
                    key=process_data['key'],
                    start_date=process_data['start_date'],
                    end_date=process_data['end_date'],
                    is_complete=False
                )
            
            # 피드백 객체 생성
            feedback = models.FeedBack.objects.create(
                project=project,
                user=user_locked,
                name=f"{project.name} 피드백"
            )
            
            # 프로젝트에 피드백 연결
            project.feedback = feedback
            project.save()
            
            logger.info(f"Successfully created project '{project.name}' with ID: {project.id}")
            return project
            
        except IntegrityError as e:
            logger.error(f"Integrity error creating project: {e}")
            raise ProjectCreationError(
                "프로젝트 생성 중 데이터 무결성 오류가 발생했습니다."
            )
        except Exception as e:
            logger.error(f"Unexpected error creating project: {e}")
            raise ProjectCreationError(
                f"프로젝트 생성 중 오류가 발생했습니다: {str(e)}"
            )


def update_project_atomic(project_id, user, update_data):
    """
    원자적 프로젝트 업데이트
    """
    with transaction.atomic():
        try:
            # SELECT FOR UPDATE로 프로젝트 잠금
            project = models.Project.objects.select_for_update().get(
                id=project_id,
                user=user
            )
            
            # 업데이트 가능한 필드만 업데이트
            updatable_fields = [
                'name', 'manager', 'consumer', 'description', 
                'color', 'tone_manner', 'genre', 'concept'
            ]
            
            for field in updatable_fields:
                if field in update_data:
                    setattr(project, field, update_data[field])
            
            project.save()
            
            logger.info(f"Successfully updated project {project_id}")
            return project
            
        except models.Project.DoesNotExist:
            raise ProjectCreationError("프로젝트를 찾을 수 없습니다.")
        except Exception as e:
            logger.error(f"Error updating project {project_id}: {e}")
            raise ProjectCreationError(
                f"프로젝트 업데이트 중 오류가 발생했습니다: {str(e)}"
            )


def delete_project_atomic(project_id, user):
    """
    원자적 프로젝트 삭제
    관련된 모든 데이터를 함께 삭제
    """
    with transaction.atomic():
        try:
            # SELECT FOR UPDATE로 프로젝트 잠금
            project = models.Project.objects.select_for_update().get(
                id=project_id,
                user=user
            )
            
            # 관련 데이터 삭제는 CASCADE로 자동 처리됨
            project_name = project.name
            project.delete()
            
            logger.info(f"Successfully deleted project '{project_name}' (ID: {project_id})")
            return True
            
        except models.Project.DoesNotExist:
            raise ProjectCreationError("프로젝트를 찾을 수 없습니다.")
        except Exception as e:
            logger.error(f"Error deleting project {project_id}: {e}")
            raise ProjectCreationError(
                f"프로젝트 삭제 중 오류가 발생했습니다: {str(e)}"
            )