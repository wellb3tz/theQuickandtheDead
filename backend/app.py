import os
import psycopg2
from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import requests
import hashlib
import hmac
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
jwt = JWTManager(app)

DATABASE_URL = os.getenv('DATABASE_URL')
conn = psycopg2.connect(DATABASE_URL, sslmode='require')
cursor = conn.cursor()

TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_BOT_SECRET = TELEGRAM_BOT_TOKEN.split(':')[1]

def check_telegram_auth(data):
    check_hash = data.pop('hash')
    data_check_string = "\n".join([f"{k}={v}" for k, v in sorted(data.items())])
    secret_key = hashlib.sha256(TELEGRAM_BOT_SECRET.encode()).digest()
    hmac_string = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    return hmac_string == check_hash

@app.route('/register', methods=['POST'])
def register():
    telegram_id = request.json.get('telegram_id')
    username = request.json.get('username')
    password = request.json.get('password')
    
    cursor.execute("SELECT * FROM users WHERE telegram_id = %s", (telegram_id,))
    user = cursor.fetchone()
    if user:
        return jsonify({"msg": "User already exists"}), 400
    
    cursor.execute("INSERT INTO users (telegram_id, username, password) VALUES (%s, %s, %s)", (telegram_id, username, password))
    conn.commit()
    return jsonify({"msg": "User registered successfully"}), 200

@app.route('/login', methods=['POST'])
def login():
    telegram_id = request.json.get('telegram_id')
    password = request.json.get('password')
    
    cursor.execute("SELECT * FROM users WHERE telegram_id = %s AND password = %s", (telegram_id, password))
    user = cursor.fetchone()
    if not user:
        return jsonify({"msg": "Bad telegram_id or password"}), 401
    
    access_token = create_access_token(identity=telegram_id)
    return jsonify(access_token=access_token), 200

@app.route('/telegram_auth', methods=['POST'])
def telegram_auth():
    auth_data = request.json
    if not check_telegram_auth(auth_data):
        return jsonify({"msg": "Telegram authentication failed"}), 401

    telegram_id = auth_data['id']
    username = auth_data['username']

    cursor.execute("SELECT * FROM users WHERE telegram_id = %s", (telegram_id,))
    user = cursor.fetchone()
    if not user:
        cursor.execute("INSERT INTO users (telegram_id, username, password) VALUES (%s, %s, %s)", (telegram_id, username, ''))
        conn.commit()

    access_token = create_access_token(identity=telegram_id)
    return jsonify(access_token=access_token), 200

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json
    chat_id = data['message']['chat']['id']
    text = data['message']['text']
    
    # Respond to the message
    response_text = f"Received your message: {text}"
    send_message(chat_id, response_text)
    
    return jsonify({"status": "ok"}), 200

def send_message(chat_id, text):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': text
    }
    requests.post(url, json=payload)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)