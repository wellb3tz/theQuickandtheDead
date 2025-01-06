from flask import Flask
from flask_jwt_extended import JWTManager

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'
jwt = JWTManager(app)

@app.route('/')
def index():
    return "Welcome to the Game Backend!"

if __name__ == '__main__':
    app.run()