# GCP GPU 서버에서 VideoPlanet 영상 분석 환경 구축

## 📋 목차
1. [사전 준비](#사전-준비)
2. [GCP 설정](#gcp-설정)
3. [서버 배포](#서버-배포)
4. [영상 분석 기능 활용](#영상-분석-기능-활용)
5. [모니터링 및 관리](#모니터링-및-관리)
6. [비용 최적화](#비용-최적화)

## 🔧 사전 준비

### 1. GCP 계정 및 프로젝트 설정
```bash
# gcloud CLI 설치 (Ubuntu/Debian)
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# 인증
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. GPU 할당량 신청
1. GCP 콘솔 → IAM 및 관리 → 할당량
2. "Compute Engine API" 검색
3. "NVIDIA T4 GPUs" 할당량 증가 요청 (최소 1개)

### 3. 결제 계정 활성화
- GPU 사용을 위해 결제 계정이 필요합니다
- 예상 비용: ~$0.40/시간 (T4 GPU + n1-standard-4)

## ⚡ GCP 설정

### 1. 필요한 API 활성화
```bash
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
```

### 2. 기본 지역/구역 설정
```bash
# 서울 리전 사용 (레이턴시 최적화)
gcloud config set compute/zone asia-northeast3-a
gcloud config set compute/region asia-northeast3
```

## 🚀 서버 배포

### 1. 자동 배포 (권장)
```bash
# 배포 스크립트 실행
chmod +x scripts/gcp-gpu-deploy.sh
./scripts/gcp-gpu-deploy.sh
```

### 2. 수동 배포
```bash
# GPU 인스턴스 생성
gcloud compute instances create videoplanet-gpu \
    --zone=asia-northeast3-a \
    --machine-type=n1-standard-4 \
    --accelerator=type=nvidia-tesla-t4,count=1 \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=100GB \
    --boot-disk-type=pd-ssd \
    --maintenance-policy=TERMINATE \
    --restart-on-failure

# 방화벽 규칙 생성
gcloud compute firewall-rules create videoplanet-http \
    --allow tcp:80,tcp:443,tcp:3000,tcp:8000 \
    --source-ranges 0.0.0.0/0 \
    --target-tags videoplanet-gpu
```

### 3. 서버 접속 및 설정
```bash
# SSH 접속
gcloud compute ssh ubuntu@videoplanet-gpu --zone=asia-northeast3-a

# NVIDIA 드라이버 설치
sudo apt-get update
sudo apt-get install -y nvidia-driver-470

# Docker 및 NVIDIA Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# NVIDIA Docker 설치
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update
sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker
```

## 🎬 영상 분석 기능 활용

### 1. 지원되는 영상 분석 기능
- **기본 변환**: MOV → MP4 (H.264/AAC)
- **GPU 가속 처리**: CUDA 기반 영상 처리
- **AI/ML 분석** (확장 가능):
  - 객체 인식 (YOLO, R-CNN)
  - 장면 분할
  - 자동 편집
  - 품질 향상

### 2. 성능 비교
| 처리 방식 | 4K 영상 (10분) | 1080p 영상 (10분) |
|-----------|----------------|-------------------|
| CPU Only  | ~45분          | ~15분             |
| GPU (T4)  | ~8분           | ~3분              |

### 3. GPU 활용 예시 코드

#### 백엔드 (Django)
```python
# vridge_back/video_processing/gpu_utils.py
import torch
import cv2
import numpy as np

def gpu_video_processing(input_path, output_path):
    """GPU를 활용한 영상 처리"""
    if torch.cuda.is_available():
        device = torch.device('cuda')
        print(f"GPU 사용: {torch.cuda.get_device_name()}")
        
        # OpenCV GPU 가속
        cap = cv2.VideoCapture(input_path)
        gpu_frame = cv2.cuda_GpuMat()
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # GPU 메모리로 업로드
            gpu_frame.upload(frame)
            
            # GPU에서 처리 (예: 노이즈 제거)
            gpu_processed = cv2.cuda.bilateralFilter(gpu_frame, -1, 50, 50)
            
            # CPU로 다운로드
            processed_frame = gpu_processed.download()
            
            # 결과 저장...
```

#### 설정 파일 업데이트
```python
# vridge_back/config/settings/production.py
import torch

# GPU 설정
USE_GPU = torch.cuda.is_available()
if USE_GPU:
    CUDA_DEVICE = 0
    print(f"GPU 활성화: {torch.cuda.get_device_name(CUDA_DEVICE)}")
```

## 📊 모니터링 및 관리

### 1. GPU 상태 모니터링
```bash
# GPU 사용률 확인
nvidia-smi

# 실시간 모니터링
watch -n 1 nvidia-smi

# Docker 컨테이너에서 GPU 확인
docker exec -it videoplanet_backend nvidia-smi
```

### 2. 로그 확인
```bash
# 전체 서비스 로그
docker-compose -f docker-compose.gpu.yml logs -f

# GPU 처리 워커 로그
docker-compose -f docker-compose.gpu.yml logs -f video_worker

# GPU 모니터링 로그
docker-compose -f docker-compose.gpu.yml logs -f gpu_monitor
```

### 3. 성능 메트릭
- **GPU 사용률**: nvidia-smi 또는 GPU 모니터 컨테이너
- **메모리 사용량**: `free -h`, `docker stats`
- **디스크 I/O**: `iotop`, `df -h`
- **네트워크**: `iftop`, `nethogs`

## 💰 비용 최적화

### 1. 예상 비용 (서울 리전)
```
n1-standard-4:     $0.1900/시간
NVIDIA Tesla T4:   $0.3500/시간
SSD 100GB:         $0.0135/시간
네트워크 (송신):   $0.12/GB
─────────────────────────────
총합:              ~$0.55/시간
월 예상 (24시간):  ~$400
```

### 2. 비용 절약 방법

#### 프리엠티블 인스턴스 사용
```bash
# 최대 80% 비용 절약 (중단 위험 있음)
gcloud compute instances create videoplanet-gpu-preemptible \
    --preemptible \
    --zone=asia-northeast3-a \
    --machine-type=n1-standard-4 \
    --accelerator=type=nvidia-tesla-t4,count=1
```

#### 자동 종료 스케줄링
```bash
# 야간 자동 종료 (cron)
echo "0 2 * * * gcloud compute instances stop videoplanet-gpu --zone=asia-northeast3-a" | crontab -

# 아침 자동 시작
echo "0 9 * * * gcloud compute instances start videoplanet-gpu --zone=asia-northeast3-a" | crontab -
```

#### 사용량 기반 스케일링
```bash
# CPU 사용률 기반 자동 종료
#!/bin/bash
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2+$4}' | sed 's/%//')
if (( $(echo "$CPU_USAGE < 10" | bc -l) )); then
    echo "낮은 CPU 사용률 감지. 30분 후 종료 예정."
    sleep 1800
    sudo shutdown -h now
fi
```

### 3. 스토리지 최적화
```bash
# 불필요한 Docker 이미지 정리
docker system prune -af

# 로그 파일 크기 제한
echo '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker
```

## 🔧 고급 설정

### 1. Multi-GPU 지원
```bash
# 2개 GPU 인스턴스 생성
gcloud compute instances create videoplanet-gpu-multi \
    --accelerator=type=nvidia-tesla-t4,count=2 \
    --machine-type=n1-standard-8
```

### 2. 커스텀 GPU 이미지
```dockerfile
# Dockerfile.gpu-custom
FROM nvidia/cuda:11.8-devel-ubuntu20.04

# 특별한 AI 모델 설치
RUN pip install transformers diffusers accelerate
```

### 3. 부하 분산
```yaml
# docker-compose.gpu-cluster.yml
version: '3.8'
services:
  video_worker_1:
    # GPU 0 할당
    environment:
      - CUDA_VISIBLE_DEVICES=0
  
  video_worker_2:
    # GPU 1 할당  
    environment:
      - CUDA_VISIBLE_DEVICES=1
```

## 🚨 트러블슈팅

### 1. GPU 인식 안됨
```bash
# 드라이버 재설치
sudo apt-get purge nvidia-*
sudo apt-get install nvidia-driver-470
sudo reboot

# NVIDIA Docker 재시작
sudo systemctl restart docker
```

### 2. 메모리 부족
```bash
# 스왑 파일 생성
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 3. 네트워크 연결 문제
```bash
# 방화벽 규칙 확인
gcloud compute firewall-rules list

# 인스턴스 태그 확인
gcloud compute instances describe videoplanet-gpu --zone=asia-northeast3-a
```

## 📞 지원 및 문의

### 문제 발생 시
1. 로그 확인: `docker-compose logs`
2. GPU 상태: `nvidia-smi`
3. 시스템 리소스: `htop`, `free -h`
4. GitHub Issues에 문제 보고

### 유용한 명령어 모음
```bash
# 인스턴스 상태 확인
gcloud compute instances list

# 비용 추적
gcloud billing budgets list

# 스냅샷 생성 (백업)
gcloud compute disks snapshot videoplanet-gpu --zone=asia-northeast3-a
```

이제 GCP GPU 서버에서 고성능 영상 분석이 가능한 VideoPlanet을 운영할 수 있습니다! 🚀