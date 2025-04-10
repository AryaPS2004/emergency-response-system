from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import jwt
from datetime import datetime, timedelta
import bcrypt
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.sentiment import SentimentIntensityAnalyzer
import string
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
import os
import certifi

# Load environment variables
load_dotenv()

# Download required NLTK data
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('vader_lexicon')

app = Flask(__name__)

# Configure CORS for production
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",  # Local development
            "https://emergency-response-app.vercel.app"  # Your Vercel domain
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize NLTK components
lemmatizer = WordNetLemmatizer()
sia = SentimentIntensityAnalyzer()
stop_words = set(stopwords.words('english'))

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET')

# Connect to MongoDB Atlas
try:
    # Connect with TLS/SSL enabled using certifi
    client = MongoClient(
        os.getenv('MONGODB_URI'),
        tlsCAFile=certifi.where(),
        connect=True,
        serverSelectionTimeoutMS=5000
    )
    
    # Test the connection
    client.admin.command('ping')
    print("Successfully connected to MongoDB Atlas!")
    
    db = client.emergency_db
    users_collection = db.users
    emergencies_collection = db.emergencies
except Exception as e:
    print(f"Error connecting to MongoDB: {str(e)}")
    raise

def create_default_users():
    # Delete existing admin and responder users
    users_collection.delete_many({'username': {'$in': ['admin', 'responder']}})
    
    # Create admin user
    admin_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
    users_collection.insert_one({
        'username': 'admin',
        'password': admin_password,
        'email': 'admin@example.com',
        'role': 'admin',
        'createdAt': datetime.utcnow()
    })
    print('Admin user created')

    # Create responder user
    responder_password = bcrypt.hashpw('responder123'.encode('utf-8'), bcrypt.gensalt())
    users_collection.insert_one({
        'username': 'responder',
        'password': responder_password,
        'email': 'responder@example.com',
        'role': 'responder',
        'createdAt': datetime.utcnow()
    })
    print('Responder user created')

# Create default users when server starts
create_default_users()

def preprocess_text(text):
    # Convert to lowercase
    text = text.lower()
    
    # Tokenize
    tokens = word_tokenize(text)
    
    # Remove stopwords and punctuation
    tokens = [token for token in tokens if token not in stop_words and token not in string.punctuation]
    
    # Lemmatize
    tokens = [lemmatizer.lemmatize(token) for token in tokens]
    
    return ' '.join(tokens)

def classify_priority(description):
    # Preprocess the text
    processed_text = preprocess_text(description)
    
    # Get sentiment scores
    sentiment_scores = sia.polarity_scores(processed_text)
    
    # Define emergency keywords with weights
    emergency_keywords = {
        'high': {
            'fire': 1.0, 'heart attack': 1.0, 'shooting': 1.0, 'explosion': 1.0,
            'bleeding': 1.0, 'unconscious': 1.0, 'not breathing': 1.0, 'weapon': 1.0,
            'gun': 1.0, 'severe': 0.8, 'critical': 0.8, 'dying': 1.0, 'death': 1.0,
            'immediate': 0.7, 'emergency': 0.7, 'urgent': 0.7, 'life-threatening': 1.0,
            'serious injury': 0.9
        },
        'medium': {
            'accident': 0.6, 'injury': 0.6, 'pain': 0.5, 'broken': 0.6,
            'cut': 0.5, 'wound': 0.5, 'sick': 0.4, 'fever': 0.4,
            'theft': 0.5, 'robbery': 0.6, 'break-in': 0.5, 'fight': 0.5,
            'assault': 0.6
        }
    }
    
    # Calculate keyword scores
    high_score = 0
    medium_score = 0
    
    for word in processed_text.split():
        for priority, keywords in emergency_keywords.items():
            for keyword, weight in keywords.items():
                if keyword in word:
                    if priority == 'high':
                        high_score += weight
                    else:
                        medium_score += weight
    
    # Consider sentiment in the final score
    sentiment_weight = 0.3
    high_score += abs(sentiment_scores['neg']) * sentiment_weight
    medium_score += abs(sentiment_scores['neu']) * sentiment_weight
    
    # Determine priority based on scores
    if high_score > 0.5:
        return 'high'
    elif medium_score > 0.3:
        return 'medium'
    else:
        return 'low'

def generate_token(user_id, role):
    token = jwt.encode({
        'user_id': str(user_id),
        'role': role,
        'exp': datetime.utcnow() + timedelta(days=1)
    }, app.config['JWT_SECRET_KEY'])
    return token

def verify_token(token):
    try:
        payload = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
            
        print(f"Attempting login for username: {username}")  # Debug log
            
        # Find user in MongoDB
        user = users_collection.find_one({'username': username})
        if not user:
            print(f"User not found: {username}")  # Debug log
            return jsonify({'error': 'Invalid credentials'}), 401
            
        # Convert password to bytes for comparison
        password_bytes = password.encode('utf-8')
        stored_password = user['password']
        
        # If stored password is string, convert it to bytes
        if isinstance(stored_password, str):
            stored_password = stored_password.encode('utf-8')
            
        if not bcrypt.checkpw(password_bytes, stored_password):
            print(f"Invalid password for user: {username}")  # Debug log
            return jsonify({'error': 'Invalid credentials'}), 401
            
        token = generate_token(user['_id'], user['role'])
        print(f"Login successful for user: {username}")  # Debug log
        return jsonify({
            'token': token,
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'email': user['email'],
                'role': user['role']
            }
        })
        
    except Exception as e:
        print(f"Login error: {str(e)}")  # Debug log
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        
        if not username or not password or not email:
            return jsonify({'error': 'Username, password, and email are required'}), 400
            
        # Check if user exists
        if users_collection.find_one({'$or': [{'username': username}, {'email': email}]}):
            return jsonify({'error': 'Username or email already exists'}), 400
            
        # Hash password
        password_bytes = password.encode('utf-8')
        hashed_password = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
        
        # Create user in MongoDB
        user = {
            'username': username,
            'password': hashed_password,
            'email': email,
            'role': 'user',
            'createdAt': datetime.utcnow()
        }
        
        result = users_collection.insert_one(user)
        
        # Generate token
        token = generate_token(result.inserted_id, user['role'])
        
        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': {
                'id': str(result.inserted_id),
                'username': user['username'],
                'email': user['email'],
                'role': user['role']
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/validate', methods=['GET'])
def validate_token():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No token provided'}), 401
            
        token = auth_header.replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'No token provided'}), 401
            
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
            
        user = users_collection.find_one({'_id': ObjectId(payload['user_id'])})
        if not user:
            return jsonify({'error': 'User not found'}), 401
            
        return jsonify({
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'email': user['email'],
                'role': user['role']
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/classify-priority', methods=['POST'])
def handle_priority_classification():
    try:
        data = request.json
        description = data.get('description', '')
        
        priority = classify_priority(description)
        
        return jsonify({
            'priority': priority,
            'confidence': 1.0  # Simplified confidence score
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/emergencies', methods=['GET'])
def get_emergencies():
    try:
        emergencies = list(emergencies_collection.find())
        # Convert ObjectId to string and map _id to id for frontend compatibility
        for emergency in emergencies:
            emergency['id'] = str(emergency['_id'])
            del emergency['_id']
            if 'userId' in emergency:
                emergency['userId'] = str(emergency['userId'])
            if 'responder' in emergency:
                emergency['responder'] = str(emergency['responder'])
        return jsonify(emergencies)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/emergencies', methods=['POST'])
def create_emergency():
    try:
        data = request.json
        emergency = {
            'type': data['type'],
            'description': data['description'],
            'location': data['location'],
            'priority': data['priority'],
            'status': 'pending',
            'timestamp': datetime.utcnow(),
            'userId': ObjectId(data['userId'])
        }
        result = emergencies_collection.insert_one(emergency)
        emergency['id'] = str(result.inserted_id)
        del emergency['_id']
        emergency['userId'] = str(emergency['userId'])
        return jsonify(emergency)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/emergencies/<emergency_id>', methods=['PUT'])
def update_emergency(emergency_id):
    try:
        data = request.json
        update_data = {}
        if 'status' in data:
            update_data['status'] = data['status']
        if 'responder' in data:
            update_data['responder'] = ObjectId(data['responder'])
        
        result = emergencies_collection.update_one(
            {'_id': ObjectId(emergency_id)},
            {'$set': update_data}
        )
        if result.modified_count == 0:
            return jsonify({'error': 'Emergency not found'}), 404
        return jsonify({'message': 'Emergency updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    try:
        app.run(port=5000, debug=True, use_reloader=False)
    except KeyboardInterrupt:
        print("\nShutting down server...")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Clean up MongoDB connection
        client.close() 