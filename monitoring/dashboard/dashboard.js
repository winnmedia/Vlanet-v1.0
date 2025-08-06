// 실시간 모니터링 대시보드 JavaScript

class MonitoringDashboard {
    constructor() {
        this.socket = null;
        this.charts = {};
        this.metrics = {
            activeUsers: 0,
            apiResponse: 0,
            errorRate: 0,
            cpuUsage: 0
        };
        this.alerts = [];
        this.init();
    }
    
    init() {
        this.connectWebSocket();
        this.setupCharts();
        this.startPolling();
    }
    
    connectWebSocket() {
        // WebSocket 연결 (실제 배포 시 URL 변경 필요)
        const wsUrl = process.env.NODE_ENV === 'production' 
            ? 'wss://videoplanet.up.railway.app/ws/monitoring'
            : 'ws://localhost:8000/ws/monitoring';
            
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
            console.log('WebSocket 연결 성공');
            this.updateStatus('backend', 'green');
        };
        
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleRealtimeData(data);
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket 에러:', error);
            this.updateStatus('backend', 'red');
        };
        
        this.socket.onclose = () => {
            console.log('WebSocket 연결 종료, 재연결 시도...');
            this.updateStatus('backend', 'yellow');
            setTimeout(() => this.connectWebSocket(), 5000);
        };
    }
    
    setupCharts() {
        // 트래픽 차트 설정
        const trafficCtx = document.getElementById('traffic-chart').getContext('2d');
        this.charts.traffic = new Chart(trafficCtx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(20),
                datasets: [{
                    label: '요청/분',
                    data: Array(20).fill(0),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
        // API 성능 차트 설정
        const apiCtx = document.getElementById('api-chart').getContext('2d');
        this.charts.api = new Chart(apiCtx, {
            type: 'bar',
            data: {
                labels: ['Login', 'Projects', 'Feedback', 'Planning', 'Export'],
                datasets: [{
                    label: '평균 응답시간 (ms)',
                    data: [120, 85, 150, 200, 95],
                    backgroundColor: [
                        '#10b981',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#10b981'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    generateTimeLabels(count) {
        const labels = [];
        const now = new Date();
        for (let i = count - 1; i >= 0; i--) {
            const time = new Date(now - i * 60000);
            labels.push(time.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }));
        }
        return labels;
    }
    
    handleRealtimeData(data) {
        switch(data.type) {
            case 'metrics':
                this.updateMetrics(data.payload);
                break;
            case 'alert':
                this.addAlert(data.payload);
                break;
            case 'traffic':
                this.updateTrafficChart(data.payload);
                break;
            case 'api_performance':
                this.updateApiChart(data.payload);
                break;
            case 'status':
                this.updateSystemStatus(data.payload);
                break;
        }
    }
    
    updateMetrics(metrics) {
        // 활성 사용자 업데이트
        if (metrics.activeUsers !== undefined) {
            this.animateValue('active-users', this.metrics.activeUsers, metrics.activeUsers, 500);
            this.metrics.activeUsers = metrics.activeUsers;
        }
        
        // API 응답시간 업데이트
        if (metrics.apiResponse !== undefined) {
            this.animateValue('api-response', this.metrics.apiResponse, metrics.apiResponse, 500, 'ms');
            this.metrics.apiResponse = metrics.apiResponse;
        }
        
        // 에러율 업데이트
        if (metrics.errorRate !== undefined) {
            this.animateValue('error-rate', this.metrics.errorRate, metrics.errorRate, 500, '%');
            this.metrics.errorRate = metrics.errorRate;
        }
        
        // CPU 사용률 업데이트
        if (metrics.cpuUsage !== undefined) {
            this.animateValue('cpu-usage', this.metrics.cpuUsage, metrics.cpuUsage, 500, '%');
            this.metrics.cpuUsage = metrics.cpuUsage;
        }
    }
    
    animateValue(elementId, start, end, duration, suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const range = end - start;
        const increment = range / (duration / 10);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.round(current) + suffix;
        }, 10);
    }
    
    updateTrafficChart(trafficData) {
        const chart = this.charts.traffic;
        if (!chart) return;
        
        // 새 데이터 추가 및 오래된 데이터 제거
        chart.data.datasets[0].data.shift();
        chart.data.datasets[0].data.push(trafficData.requests);
        
        // 레이블 업데이트
        chart.data.labels.shift();
        chart.data.labels.push(new Date().toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        }));
        
        chart.update('none'); // 애니메이션 없이 업데이트
    }
    
    updateApiChart(apiData) {
        const chart = this.charts.api;
        if (!chart) return;
        
        // API별 응답시간 업데이트
        Object.keys(apiData).forEach((endpoint, index) => {
            if (chart.data.datasets[0].data[index] !== undefined) {
                chart.data.datasets[0].data[index] = apiData[endpoint];
                
                // 색상 업데이트 (응답시간에 따라)
                if (apiData[endpoint] < 100) {
                    chart.data.datasets[0].backgroundColor[index] = '#10b981';
                } else if (apiData[endpoint] < 200) {
                    chart.data.datasets[0].backgroundColor[index] = '#f59e0b';
                } else {
                    chart.data.datasets[0].backgroundColor[index] = '#ef4444';
                }
            }
        });
        
        chart.update();
    }
    
    addAlert(alert) {
        const alertsList = document.getElementById('alerts-list');
        
        // 새 알림 생성
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item ${alert.severity}`;
        alertElement.innerHTML = `
            <div class="alert-time">${new Date().toLocaleString('ko-KR')}</div>
            <div class="alert-message">${alert.message}</div>
        `;
        
        // 리스트 상단에 추가
        alertsList.insertBefore(alertElement, alertsList.firstChild);
        
        // 최대 20개 알림만 유지
        while (alertsList.children.length > 20) {
            alertsList.removeChild(alertsList.lastChild);
        }
        
        // 중요 알림은 브라우저 알림으로도 표시
        if (alert.severity === 'error' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('VideoPlanet 모니터링 알림', {
                body: alert.message,
                icon: '/favicon.ico'
            });
        }
    }
    
    updateSystemStatus(status) {
        // 각 시스템 상태 업데이트
        Object.keys(status).forEach(system => {
            this.updateStatus(system, status[system]);
        });
    }
    
    updateStatus(system, status) {
        const element = document.getElementById(`${system}-status`);
        if (element) {
            element.className = `status-indicator ${status}`;
        }
    }
    
    startPolling() {
        // 메트릭 폴링 (10초마다)
        setInterval(() => {
            this.fetchMetrics();
        }, 10000);
        
        // 시스템 상태 체크 (30초마다)
        setInterval(() => {
            this.checkSystemHealth();
        }, 30000);
        
        // 초기 데이터 로드
        this.fetchMetrics();
        this.checkSystemHealth();
    }
    
    async fetchMetrics() {
        try {
            const response = await fetch('/api/monitoring/metrics');
            const data = await response.json();
            this.updateMetrics(data);
        } catch (error) {
            console.error('메트릭 가져오기 실패:', error);
        }
    }
    
    async checkSystemHealth() {
        // Frontend 상태 체크
        try {
            const response = await fetch('https://vlanet.net/api/health', { 
                method: 'GET',
                mode: 'no-cors'
            });
            this.updateStatus('frontend', 'green');
        } catch {
            this.updateStatus('frontend', 'red');
        }
        
        // Backend 상태 체크
        try {
            const response = await fetch('https://videoplanet.up.railway.app/api/health/');
            const data = await response.json();
            this.updateStatus('backend', data.status === 'healthy' ? 'green' : 'yellow');
            this.updateStatus('database', data.database === 'ok' ? 'green' : 'red');
            this.updateStatus('redis', data.cache === 'ok' ? 'green' : 'red');
        } catch {
            this.updateStatus('backend', 'red');
        }
    }
}

// 브라우저 알림 권한 요청
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// 대시보드 초기화
document.addEventListener('DOMContentLoaded', () => {
    new MonitoringDashboard();
});