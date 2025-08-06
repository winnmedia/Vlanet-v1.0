/**
 * 통합 알림 매니저
 * Slack, Discord, Email 알림 지원
 */

const axios = require('axios');
const nodemailer = require('nodemailer');

class AlertManager {
    constructor(config) {
        this.config = config;
        this.alertHistory = [];
        this.alertThresholds = {
            cpu: { warning: 70, critical: 90 },
            memory: { warning: 80, critical: 95 },
            disk: { warning: 80, critical: 90 },
            errorRate: { warning: 5, critical: 10 },
            responseTime: { warning: 1000, critical: 3000 }
        };
        this.cooldownPeriod = 5 * 60 * 1000; // 5분
        this.lastAlertTime = {};
    }
    
    /**
     * 알림 발송
     */
    async sendAlert(alert) {
        // 쿨다운 체크
        if (this.isInCooldown(alert)) {
            console.log(`Alert in cooldown: ${alert.title}`);
            return;
        }
        
        // 알림 히스토리 저장
        this.alertHistory.push({
            ...alert,
            timestamp: new Date().toISOString()
        });
        
        // 심각도에 따라 채널 선택
        const channels = this.getChannelsForSeverity(alert.severity);
        
        // 각 채널로 알림 발송
        const promises = channels.map(channel => {
            switch (channel) {
                case 'slack':
                    return this.sendSlackAlert(alert);
                case 'discord':
                    return this.sendDiscordAlert(alert);
                case 'email':
                    return this.sendEmailAlert(alert);
                case 'sms':
                    return this.sendSMSAlert(alert);
                default:
                    return Promise.resolve();
            }
        });
        
        await Promise.allSettled(promises);
        
        // 쿨다운 업데이트
        this.updateCooldown(alert);
    }
    
    /**
     * Slack 알림
     */
    async sendSlackAlert(alert) {
        if (!this.config.slack?.webhookUrl) return;
        
        const color = this.getSeverityColor(alert.severity);
        const emoji = this.getSeverityEmoji(alert.severity);
        
        const payload = {
            text: `${emoji} *${alert.title}*`,
            attachments: [{
                color: color,
                fields: [
                    {
                        title: 'Environment',
                        value: alert.environment || 'production',
                        short: true
                    },
                    {
                        title: 'Severity',
                        value: alert.severity.toUpperCase(),
                        short: true
                    },
                    {
                        title: 'Description',
                        value: alert.description,
                        short: false
                    },
                    {
                        title: 'Metric',
                        value: `\`${alert.metric || 'N/A'}\``,
                        short: true
                    },
                    {
                        title: 'Value',
                        value: `\`${alert.value || 'N/A'}\``,
                        short: true
                    }
                ],
                footer: 'VideoPlanet Monitoring',
                ts: Math.floor(Date.now() / 1000),
                actions: alert.actions || []
            }]
        };
        
        // 그래프 이미지 추가 (있는 경우)
        if (alert.graphUrl) {
            payload.attachments[0].image_url = alert.graphUrl;
        }
        
        try {
            await axios.post(this.config.slack.webhookUrl, payload);
            console.log('Slack alert sent successfully');
        } catch (error) {
            console.error('Failed to send Slack alert:', error.message);
        }
    }
    
    /**
     * Discord 알림
     */
    async sendDiscordAlert(alert) {
        if (!this.config.discord?.webhookUrl) return;
        
        const color = this.getSeverityColorHex(alert.severity);
        const emoji = this.getSeverityEmoji(alert.severity);
        
        const embed = {
            title: `${emoji} ${alert.title}`,
            description: alert.description,
            color: parseInt(color.replace('#', ''), 16),
            fields: [
                {
                    name: 'Environment',
                    value: alert.environment || 'production',
                    inline: true
                },
                {
                    name: 'Severity',
                    value: alert.severity.toUpperCase(),
                    inline: true
                },
                {
                    name: 'Metric',
                    value: `\`${alert.metric || 'N/A'}\``,
                    inline: true
                },
                {
                    name: 'Current Value',
                    value: `\`${alert.value || 'N/A'}\``,
                    inline: true
                },
                {
                    name: 'Threshold',
                    value: `\`${alert.threshold || 'N/A'}\``,
                    inline: true
                },
                {
                    name: 'Time',
                    value: new Date().toLocaleString('ko-KR'),
                    inline: true
                }
            ],
            footer: {
                text: 'VideoPlanet Monitoring System'
            },
            timestamp: new Date().toISOString()
        };
        
        // 그래프 이미지 추가
        if (alert.graphUrl) {
            embed.image = { url: alert.graphUrl };
        }
        
        const payload = {
            username: 'VideoPlanet Monitor',
            avatar_url: 'https://vlanet.net/logo.png',
            embeds: [embed]
        };
        
        // 멘션 추가 (critical인 경우)
        if (alert.severity === 'critical') {
            payload.content = '@everyone 🚨 Critical Alert!';
        }
        
        try {
            await axios.post(this.config.discord.webhookUrl, payload);
            console.log('Discord alert sent successfully');
        } catch (error) {
            console.error('Failed to send Discord alert:', error.message);
        }
    }
    
    /**
     * Email 알림
     */
    async sendEmailAlert(alert) {
        if (!this.config.email?.enabled) return;
        
        const transporter = nodemailer.createTransporter({
            host: this.config.email.smtp.host,
            port: this.config.email.smtp.port,
            secure: this.config.email.smtp.secure,
            auth: {
                user: this.config.email.smtp.user,
                pass: this.config.email.smtp.pass
            }
        });
        
        const emoji = this.getSeverityEmoji(alert.severity);
        const color = this.getSeverityColor(alert.severity);
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .alert-container {
                        border: 2px solid ${color};
                        border-radius: 8px;
                        padding: 20px;
                        margin: 20px 0;
                    }
                    .alert-header {
                        color: ${color};
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .metric-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                    }
                    .metric-table td {
                        padding: 8px;
                        border-bottom: 1px solid #ddd;
                    }
                    .metric-table td:first-child {
                        font-weight: bold;
                        width: 30%;
                    }
                    .footer {
                        margin-top: 20px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        color: #666;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="alert-container">
                    <div class="alert-header">
                        ${emoji} ${alert.title}
                    </div>
                    <p>${alert.description}</p>
                    
                    <table class="metric-table">
                        <tr>
                            <td>Environment:</td>
                            <td>${alert.environment || 'production'}</td>
                        </tr>
                        <tr>
                            <td>Severity:</td>
                            <td>${alert.severity.toUpperCase()}</td>
                        </tr>
                        <tr>
                            <td>Metric:</td>
                            <td>${alert.metric || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Current Value:</td>
                            <td>${alert.value || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Threshold:</td>
                            <td>${alert.threshold || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Time:</td>
                            <td>${new Date().toLocaleString('ko-KR')}</td>
                        </tr>
                    </table>
                    
                    ${alert.recommendation ? `
                        <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 5px;">
                            <strong>Recommended Action:</strong><br>
                            ${alert.recommendation}
                        </div>
                    ` : ''}
                </div>
                
                <div class="footer">
                    <p>This alert was generated by VideoPlanet Monitoring System</p>
                    <p>Dashboard: <a href="https://monitoring.vlanet.net">https://monitoring.vlanet.net</a></p>
                </div>
            </body>
            </html>
        `;
        
        const mailOptions = {
            from: this.config.email.from,
            to: this.getEmailRecipients(alert.severity),
            subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
            html: htmlContent
        };
        
        try {
            await transporter.sendMail(mailOptions);
            console.log('Email alert sent successfully');
        } catch (error) {
            console.error('Failed to send email alert:', error.message);
        }
    }
    
    /**
     * SMS 알림 (Critical only)
     */
    async sendSMSAlert(alert) {
        if (!this.config.sms?.enabled || alert.severity !== 'critical') return;
        
        // Twilio 또는 다른 SMS 서비스 사용
        // 여기서는 예시로 Twilio 사용
        const accountSid = this.config.sms.twilioAccountSid;
        const authToken = this.config.sms.twilioAuthToken;
        const client = require('twilio')(accountSid, authToken);
        
        const message = `🚨 CRITICAL: ${alert.title}\n${alert.description}\nValue: ${alert.value}`;
        
        const recipients = this.config.sms.recipients || [];
        
        for (const recipient of recipients) {
            try {
                await client.messages.create({
                    body: message,
                    from: this.config.sms.from,
                    to: recipient
                });
                console.log(`SMS alert sent to ${recipient}`);
            } catch (error) {
                console.error(`Failed to send SMS to ${recipient}:`, error.message);
            }
        }
    }
    
    /**
     * 심각도별 색상
     */
    getSeverityColor(severity) {
        const colors = {
            info: '#36a64f',
            warning: '#ff9900',
            error: '#ff0000',
            critical: '#990000'
        };
        return colors[severity] || '#808080';
    }
    
    getSeverityColorHex(severity) {
        const colors = {
            info: '#36a64f',
            warning: '#ff9900',
            error: '#ff0000',
            critical: '#990000'
        };
        return colors[severity] || '#808080';
    }
    
    /**
     * 심각도별 이모지
     */
    getSeverityEmoji(severity) {
        const emojis = {
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌',
            critical: '🚨'
        };
        return emojis[severity] || '📌';
    }
    
    /**
     * 심각도별 알림 채널
     */
    getChannelsForSeverity(severity) {
        const channelMap = {
            info: ['slack'],
            warning: ['slack', 'discord'],
            error: ['slack', 'discord', 'email'],
            critical: ['slack', 'discord', 'email', 'sms']
        };
        return channelMap[severity] || ['slack'];
    }
    
    /**
     * 이메일 수신자 결정
     */
    getEmailRecipients(severity) {
        const recipientMap = {
            info: this.config.email.recipients.info || [],
            warning: this.config.email.recipients.warning || [],
            error: this.config.email.recipients.error || [],
            critical: this.config.email.recipients.critical || []
        };
        return recipientMap[severity].join(', ');
    }
    
    /**
     * 쿨다운 체크
     */
    isInCooldown(alert) {
        const key = `${alert.type}_${alert.metric}`;
        const lastTime = this.lastAlertTime[key];
        
        if (!lastTime) return false;
        
        const timeDiff = Date.now() - lastTime;
        return timeDiff < this.cooldownPeriod;
    }
    
    /**
     * 쿨다운 업데이트
     */
    updateCooldown(alert) {
        const key = `${alert.type}_${alert.metric}`;
        this.lastAlertTime[key] = Date.now();
    }
    
    /**
     * 에스컬레이션 처리
     */
    async handleEscalation(alert) {
        // 30분 내에 같은 알림이 3번 이상 발생하면 에스컬레이션
        const recentAlerts = this.alertHistory.filter(a => {
            return a.type === alert.type && 
                   a.metric === alert.metric &&
                   (Date.now() - new Date(a.timestamp).getTime()) < 30 * 60 * 1000;
        });
        
        if (recentAlerts.length >= 3) {
            // 심각도 상승
            const escalatedAlert = {
                ...alert,
                severity: 'critical',
                title: `[ESCALATED] ${alert.title}`,
                description: `${alert.description}\n\n⚠️ This alert has occurred ${recentAlerts.length} times in the last 30 minutes.`
            };
            
            await this.sendAlert(escalatedAlert);
        }
    }
}

module.exports = AlertManager;