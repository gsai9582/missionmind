const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Attempt loading from root .env if present (ignored if file not found)
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoints for Render
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'missionmind-backend',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'missionmind-backend',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/observations', require('./routes/observations'));

// Optional: Serve frontend static build if present
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const localDistPath = path.join(__dirname, 'public');

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else if (fs.existsSync(localDistPath)) {
  app.use(express.static(localDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(localDistPath, 'index.html'));
  });
}

const seed = require('./seed');

// Database connection
async function startServer() {
  try {
    let mongoUri = process.env.MONGODB_URI;
    let isMemory = false;

    if (!mongoUri) {
      console.log('No MONGODB_URI found. Attempting to start in-memory MongoDB server...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        mongoUri = mongoServer.getUri();
        isMemory = true;
      } catch (memErr) {
        console.error('In-memory MongoDB unavailable. Please configure MONGODB_URI.');
        throw memErr;
      }
    }
    
    await mongoose.connect(mongoUri);
    // Sanitize log to prevent leaking connection string passwords
    const sanitizedUri = mongoUri.replace(/\/\/[^@]+@/, '//***:***@');
    console.log(`Connected to MongoDB: ${sanitizedUri}`);
    
    if (isMemory) {
       console.log('Seeding in-memory database automatically...');
       await seed(mongoUri);
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

startServer();
