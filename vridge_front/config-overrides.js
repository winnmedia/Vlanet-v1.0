const { override, addWebpackPlugin } = require('customize-cra');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = override(
  // Gzip 압축 추가
  addWebpackPlugin(
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    })
  ),
  
  // Webpack 설정 커스터마이징
  (config) => {
    // Production 환경에서만 최적화 적용
    if (config.mode === 'production') {
      // SplitChunks 최적화
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // 벤더 청크 분리
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          // 큰 라이브러리들을 개별 청크로 분리
          antd: {
            name: 'antd',
            test: /[\\/]node_modules[\\/]antd[\\/]/,
            priority: 30,
            reuseExistingChunk: true
          },
          moment: {
            name: 'moment',
            test: /[\\/]node_modules[\\/]moment[\\/]/,
            priority: 30,
            reuseExistingChunk: true
          },
          video: {
            name: 'video',
            test: /[\\/]node_modules[\\/](video\.js|@videojs|@vidstack)[\\/]/,
            priority: 30,
            reuseExistingChunk: true
          },
          // 공통 청크
          common: {
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      };

      // Terser 최적화 설정
      config.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
              drop_console: true, // console.log 제거
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
        }),
      ];
    }

    return config;
  }
);