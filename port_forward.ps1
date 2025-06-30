# Windows PowerShell 스크립트 (관리자 권한으로 실행)
$wslIp = (wsl hostname -I).Trim()
Write-Host "WSL IP: $wslIp"

# 포트 포워딩 규칙 추가
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=127.0.0.1 connectport=3000 connectaddress=$wslIp
netsh interface portproxy add v4tov4 listenport=8000 listenaddress=127.0.0.1 connectport=8000 connectaddress=$wslIp

Write-Host "포트 포워딩 설정 완료"
Write-Host "이제 http://localhost:3000 으로 접속하세요"