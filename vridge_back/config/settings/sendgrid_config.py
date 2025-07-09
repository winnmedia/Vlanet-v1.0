# 호환성을 위한 리다이렉트 파일
# 실제 설정은 railway.py를 사용합니다
from .railway import *

print("WARNING: config.settings.sendgrid_config is deprecated. Use config.settings.railway instead.")