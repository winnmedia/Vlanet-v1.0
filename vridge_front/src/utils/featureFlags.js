/**
 * Feature Flags 관리 시스템
 * A/B 테스팅, Canary 배포, 점진적 롤아웃 지원
 */

class FeatureFlagsManager {
    constructor() {
        this.flags = {};
        this.userId = null;
        this.userSegment = null;
        this.initialized = false;
        this.listeners = new Map();
    }
    
    /**
     * Feature Flags 초기화
     */
    async initialize(userId = null) {
        try {
            // 사용자 ID 설정
            this.userId = userId || this.generateAnonymousId();
            
            // 서버에서 플래그 가져오기
            const response = await fetch('/api/feature-flags', {
                headers: {
                    'X-User-Id': this.userId
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.flags = data.flags || {};
                this.userSegment = data.segment || 'default';
            } else {
                // 폴백: 로컬 스토리지에서 가져오기
                this.loadFromLocalStorage();
            }
            
            this.initialized = true;
            this.notifyListeners();
            
            // 주기적으로 플래그 업데이트 (5분마다)
            this.startPolling();
            
        } catch (error) {
            console.error('Feature flags 초기화 실패:', error);
            this.loadFromLocalStorage();
        }
    }
    
    /**
     * 익명 사용자 ID 생성
     */
    generateAnonymousId() {
        let id = localStorage.getItem('anonymous_user_id');
        if (!id) {
            id = 'anon_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('anonymous_user_id', id);
        }
        return id;
    }
    
    /**
     * 로컬 스토리지에서 플래그 로드
     */
    loadFromLocalStorage() {
        const stored = localStorage.getItem('feature_flags');
        if (stored) {
            try {
                this.flags = JSON.parse(stored);
            } catch (e) {
                this.flags = {};
            }
        }
    }
    
    /**
     * 로컬 스토리지에 플래그 저장
     */
    saveToLocalStorage() {
        localStorage.setItem('feature_flags', JSON.stringify(this.flags));
    }
    
    /**
     * Feature Flag 확인
     */
    isEnabled(flagName, defaultValue = false) {
        if (!this.initialized) {
            console.warn('Feature flags not initialized');
            return defaultValue;
        }
        
        const flag = this.flags[flagName];
        if (!flag) return defaultValue;
        
        // 플래그 타입별 처리
        switch (flag.type) {
            case 'boolean':
                return flag.enabled;
                
            case 'percentage':
                return this.checkPercentageRollout(flag);
                
            case 'segment':
                return this.checkSegment(flag);
                
            case 'schedule':
                return this.checkSchedule(flag);
                
            case 'variant':
                return this.getVariant(flag) !== null;
                
            default:
                return flag.enabled || defaultValue;
        }
    }
    
    /**
     * 퍼센티지 기반 롤아웃 체크
     */
    checkPercentageRollout(flag) {
        const percentage = flag.percentage || 0;
        const userHash = this.hashCode(this.userId + flag.name);
        const bucket = Math.abs(userHash) % 100;
        return bucket < percentage;
    }
    
    /**
     * 세그먼트 체크
     */
    checkSegment(flag) {
        const allowedSegments = flag.segments || [];
        return allowedSegments.includes(this.userSegment);
    }
    
    /**
     * 스케줄 체크
     */
    checkSchedule(flag) {
        const now = new Date();
        const start = flag.startDate ? new Date(flag.startDate) : null;
        const end = flag.endDate ? new Date(flag.endDate) : null;
        
        if (start && now < start) return false;
        if (end && now > end) return false;
        return flag.enabled;
    }
    
    /**
     * A/B 테스트 변형 가져오기
     */
    getVariant(flagName) {
        const flag = this.flags[flagName];
        if (!flag || flag.type !== 'variant') return null;
        
        const variants = flag.variants || [];
        if (variants.length === 0) return null;
        
        // 사용자별로 일관된 변형 할당
        const userHash = this.hashCode(this.userId + flagName);
        const index = Math.abs(userHash) % variants.length;
        return variants[index];
    }
    
    /**
     * 문자열 해시 함수
     */
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
    
    /**
     * 플래그 변경 리스너 등록
     */
    onChange(flagName, callback) {
        if (!this.listeners.has(flagName)) {
            this.listeners.set(flagName, new Set());
        }
        this.listeners.get(flagName).add(callback);
        
        // 리스너 제거 함수 반환
        return () => {
            const callbacks = this.listeners.get(flagName);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }
    
    /**
     * 리스너에게 변경 알림
     */
    notifyListeners(flagName = null) {
        if (flagName) {
            const callbacks = this.listeners.get(flagName);
            if (callbacks) {
                callbacks.forEach(callback => callback(this.isEnabled(flagName)));
            }
        } else {
            // 모든 리스너에게 알림
            this.listeners.forEach((callbacks, flag) => {
                callbacks.forEach(callback => callback(this.isEnabled(flag)));
            });
        }
    }
    
    /**
     * 주기적 플래그 업데이트
     */
    startPolling() {
        setInterval(async () => {
            try {
                const response = await fetch('/api/feature-flags', {
                    headers: {
                        'X-User-Id': this.userId
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const oldFlags = { ...this.flags };
                    this.flags = data.flags || {};
                    
                    // 변경된 플래그 찾기
                    Object.keys(this.flags).forEach(flagName => {
                        if (JSON.stringify(oldFlags[flagName]) !== JSON.stringify(this.flags[flagName])) {
                            this.notifyListeners(flagName);
                        }
                    });
                    
                    this.saveToLocalStorage();
                }
            } catch (error) {
                console.error('Feature flags 업데이트 실패:', error);
            }
        }, 5 * 60 * 1000); // 5분
    }
    
    /**
     * 이벤트 추적 (A/B 테스트용)
     */
    trackEvent(eventName, properties = {}) {
        const event = {
            name: eventName,
            properties,
            userId: this.userId,
            segment: this.userSegment,
            flags: Object.keys(this.flags).reduce((acc, key) => {
                acc[key] = this.isEnabled(key);
                return acc;
            }, {}),
            timestamp: new Date().toISOString()
        };
        
        // 이벤트를 서버로 전송
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        }).catch(error => {
            console.error('이벤트 추적 실패:', error);
        });
    }
    
    /**
     * 수동 플래그 오버라이드 (개발/테스트용)
     */
    override(flagName, value) {
        if (process.env.NODE_ENV !== 'production') {
            this.flags[flagName] = { enabled: value, type: 'boolean' };
            this.notifyListeners(flagName);
            console.log(`Feature flag '${flagName}' overridden to ${value}`);
        }
    }
    
    /**
     * 모든 플래그 상태 가져오기
     */
    getAllFlags() {
        return Object.keys(this.flags).reduce((acc, key) => {
            acc[key] = this.isEnabled(key);
            return acc;
        }, {});
    }
}

// React Hook for Feature Flags
export function useFeatureFlag(flagName, defaultValue = false) {
    const [enabled, setEnabled] = React.useState(() => 
        featureFlags.isEnabled(flagName, defaultValue)
    );
    
    React.useEffect(() => {
        // 플래그 변경 감지
        const unsubscribe = featureFlags.onChange(flagName, setEnabled);
        
        // 초기값 설정
        setEnabled(featureFlags.isEnabled(flagName, defaultValue));
        
        return unsubscribe;
    }, [flagName, defaultValue]);
    
    return enabled;
}

// React Component for A/B Testing
export function ABTest({ flag, variantA, variantB, fallback = null }) {
    const variant = featureFlags.getVariant(flag);
    
    if (variant === 'A') return variantA;
    if (variant === 'B') return variantB;
    return fallback;
}

// React Component for Feature Toggle
export function Feature({ flag, children, fallback = null }) {
    const enabled = useFeatureFlag(flag);
    
    if (enabled) return children;
    return fallback;
}

// 싱글톤 인스턴스
const featureFlags = new FeatureFlagsManager();

export default featureFlags;