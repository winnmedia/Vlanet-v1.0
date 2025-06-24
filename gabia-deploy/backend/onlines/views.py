import logging
from django.shortcuts import render
from . import models
from django.http import JsonResponse
from django.views import View


class OnlineVideo(View):
    def get(self, request):
        try:
            online = list(models.OnlineVideo.objects.all().values("link"))
            return JsonResponse({"result": online}, status=200)
        except Exception as e:
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)
