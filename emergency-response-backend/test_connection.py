from pymongo import MongoClient
import os
from dotenv import load_dotenv
import jwt
from datetime import datetime, timedelta

def test_mongodb_connection():
    try:
        # Load environment variables
        load_dotenv()
        
        # Connect to MongoDB Atlas
        client = MongoClient(os.getenv('MONGODB_URI'))
        
        # Test connection
        client.admin.command('ismaster')
        print("✅ Successfully connected to MongoDB Atlas!")
        
        # Test database access
        db = client.emergency_db
        print("✅ Successfully accessed emergency_db database!")
        
        # Test collections
        users_count = db.users.count_documents({})
        emergencies_count = db.emergencies.count_documents({})
        print(f"✅ Found {users_count} users and {emergencies_count} emergencies in the database")
        
        return True
    except Exception as e:
        print(f"❌ Error connecting to MongoDB Atlas: {str(e)}")
        return False

def test_jwt_functionality():
    try:
        # Load environment variables
        load_dotenv()
        
        # Get JWT secret
        jwt_secret = os.getenv('JWT_SECRET')
        if not jwt_secret:
            print("❌ JWT_SECRET not found in environment variables")
            return False
            
        # Create a test token
        test_payload = {
            'user_id': 'test_user_id',
            'role': 'test_role',
            'exp': datetime.utcnow() + timedelta(days=1)
        }
        
        # Encode token
        token = jwt.encode(test_payload, jwt_secret, algorithm='HS256')
        print("✅ Successfully created JWT token")
        
        # Decode token
        decoded_payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        print("✅ Successfully decoded JWT token")
        
        # Verify payload
        if decoded_payload['user_id'] == 'test_user_id' and decoded_payload['role'] == 'test_role':
            print("✅ JWT payload verification successful")
            return True
        else:
            print("❌ JWT payload verification failed")
            return False
            
    except Exception as e:
        print(f"❌ Error testing JWT functionality: {str(e)}")
        return False

if __name__ == "__main__":
    print("\n=== Testing MongoDB Atlas Connection ===")
    mongodb_success = test_mongodb_connection()
    
    print("\n=== Testing JWT Functionality ===")
    jwt_success = test_jwt_functionality()
    
    print("\n=== Test Results ===")
    if mongodb_success and jwt_success:
        print("✅ All tests passed! Your application is configured correctly.")
    else:
        print("❌ Some tests failed. Please check the errors above.") 