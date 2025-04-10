# Emergency Response System

A real-time emergency response management system that allows users to report emergencies, and enables responders and administrators to manage and respond to these emergencies efficiently.

## Features

- User authentication and role-based access control
- Real-time emergency reporting and tracking
- Intelligent emergency classification using NLP
- Geolocation support for emergency reporting
- Admin dashboard for system management
- Responder dashboard for emergency handling
- User dashboard for emergency reporting and tracking

## Tech Stack

### Frontend
- React with TypeScript
- Material-UI (MUI)
- React Router
- Context API for state management

### Backend
- Python with Flask
- MongoDB Atlas
- JWT for authentication
- NLTK for natural language processing

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MongoDB Atlas account
- NPM or Yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/emergency-response-system.git
cd emergency-response-system
```

2. Install backend dependencies:
```bash
cd emergency-response-backend
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd emergency-response-app
npm install
```

4. Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## Running the Application

1. Start the backend server:
```bash
cd emergency-response-backend
python app.py
```

2. Start the frontend development server:
```bash
cd emergency-response-app
npm start
```

The application will be available at `http://localhost:3000`

## Default Users

### Admin
- Username: admin
- Password: admin123

### Responder
- Username: responder
- Password: responder123

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 