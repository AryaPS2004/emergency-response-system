const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const initializeDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/emergency-response', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create test users
    const users = [
      {
        username: 'admin',
        password: 'admin123',
        email: 'admin@example.com',
        role: 'admin'
      },
      {
        username: 'user',
        password: 'user123',
        email: 'user@example.com',
        role: 'user'
      },
      {
        username: 'responder',
        password: 'responder123',
        email: 'responder@example.com',
        role: 'responder'
      }
    ];

    // Hash passwords and create users
    for (const user of users) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      await User.create(user);
    }

    console.log('Test users created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initializeDatabase(); 