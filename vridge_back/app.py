import os
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        'status': 'ok',
        'message': 'Flask server running',
        'port': os.environ.get('PORT', 'unknown')
    })

@app.route('/api/health/')
@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'service': 'vridge-backend'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)