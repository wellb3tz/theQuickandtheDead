import os
import psycopg2
from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import requests

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'
jwt = JWTManager(app)

DATABASE_URL = "postgresql://postgres:N7tX1h3p7aZHucQu@dowdily-parental-pochard.data-1.use1.tembo.io:5432/postgres"
conn = psycopg2.connect(DATABASE_URL, sslmode='require')
cursor = conn.cursor()

TELEGRAM_BOT_TOKEN = "7900896890:AAEENVv_A-kmd9LDyx9124RRdpichJQ012k"

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
    telegram_id = request.json.get('telegram_id')
    auth_data = request.json.get('auth_data')
    
    # Verify Telegram authentication
    auth_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getMe"
    response = requests.get(auth_url)
    if response.status_code != 200:
        return jsonify({"msg": "Telegram authentication failed"}), 401
    
    cursor.execute("SELECT * FROM users WHERE telegram_id = %s", (telegram_id,))
    user = cursor.fetchone()
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    access_token = create_access_token(identity=telegram_id)
    return jsonify(access_token=access_token), 200

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

if __name__ == '__main__':
    app.run()