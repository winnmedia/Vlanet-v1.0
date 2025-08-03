# ProjectDate 클래스 수정 제안

@method_decorator(csrf_exempt, name='dispatch')
class ProjectDate(View):
    @user_validator
    def post(self, request, id):
        try:
            user = request.user

            project = models.Project.objects.get_or_none(id=id)
            if project is None:
                return JsonResponse({"message": "프로젝트를 찾을 수  없습니다."}, status=404)

            is_member = models.Members.objects.get_or_none(project=project, user=user, rating="manager")
            if project.user != user and is_member is None:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)

            data = json.loads(request.body)
            key = data.get("key")
            start_date = data.get("start_date")
            end_date = data.get("end_date")
            completed = data.get("completed", False)  # completed 필드 추가

            # 프로세스 객체 가져오기 또는 생성
            process_model_map = {
                'basic_plan': models.BasicPlan,
                'story_board': models.Storyboard,
                'filming': models.Filming,
                'video_edit': models.VideoEdit,
                'post_work': models.PostWork,
                'video_preview': models.VideoPreview,
                'confirmation': models.Confirmation,
                'video_delivery': models.VideoDelivery,
            }
            
            if key not in process_model_map:
                return JsonResponse({"message": f"잘못된 프로세스 키: {key}"}, status=400)
            
            # 현재 프로세스 객체 가져오기
            get_process = getattr(project, key)
            
            if get_process is None:
                # 프로세스 객체가 없으면 새로 생성
                ProcessModel = process_model_map[key]
                get_process = ProcessModel.objects.create(
                    start_date=start_date,
                    end_date=end_date
                )
                # 프로젝트에 연결
                setattr(project, key, get_process)
                project.save()
            else:
                # 기존 객체 업데이트
                get_process.start_date = start_date
                get_process.end_date = end_date
                
                # completed 필드가 있다면 처리 (모델에 따라 다를 수 있음)
                if hasattr(get_process, 'completed'):
                    get_process.completed = completed
                    
                get_process.save()

            return JsonResponse({"message": "success"}, status=200)

        except Exception as e:
            logger.error(f"Error in project date update: {str(e)}", exc_info=True)
            return JsonResponse({
                "message": "알 수 없는 에러입니다 고객센터에 문의해주세요.",
                "error": str(e)  # 개발 환경에서만 사용
            }, status=500)