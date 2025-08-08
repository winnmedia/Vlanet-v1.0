module.exports = {
  plugins: [
    // PostCSS 플러그인을 배열 형식으로 명시적으로 정의
    'autoprefixer',
    // Production 환경에서만 PurgeCSS와 cssnano 적용
    ...(process.env.NODE_ENV === 'production' && process.env.DISABLE_POSTCSS_PURGE !== 'true'
      ? [
          ['@fullhuman/postcss-purgecss', {
            content: [
              './pages/**/*.{js,jsx,ts,tsx}',
              './src/**/*.{js,jsx,ts,tsx}',
              './components/**/*.{js,jsx,ts,tsx}',
            ],
            defaultExtractor: (content) => {
              // Tailwind CSS 호환 extractor
              const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || []
              const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || []
              return broadMatches.concat(innerMatches)
            },
            safelist: [
              // Ant Design 필수 클래스
              /^ant-/,
              /^antd-/,
              // 동적 클래스들
              /^(.*-)?active$/,
              /^(.*-)?selected$/,
              /^(.*-)?disabled$/,
              /^(.*-)?loading$/,
              /^(.*-)?error$/,
              // Video.js 클래스들
              /^video-js/,
              /^vjs-/,
              // React transition 클래스들
              /-(enter|enter-active|exit|exit-active)$/,
            ],
            blocklist: [
              // 불필요한 클래스들
              'unused-class',
            ]
          }],
          ['cssnano', {
            preset: ['default', {
              discardComments: {
                removeAll: true,
              },
              normalizeUnicode: false,
            }]
          }]
        ]
      : []
    ),
  ],
}