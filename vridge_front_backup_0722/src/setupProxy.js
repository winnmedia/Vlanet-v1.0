const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // API 요청만 프록시
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).send('Proxy Error');
      }
    })
  );
  
  // /media 경로도 프록시 (미디어 파일용)
  app.use(
    '/media',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
    })
  );
};