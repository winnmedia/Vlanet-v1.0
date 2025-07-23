const express = require('express');
const path = require('path');
const app = express();

// 포트 설정
const PORT = process.env.PORT || 3000;

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'build')));

// 모든 경로에 대해 index.html 반환 (React Router 지원)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});