export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    service: 'frontend',
    message: 'VideoPlanet Frontend Service',
    timestamp: new Date().toISOString()
  });
}