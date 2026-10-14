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

// Root landing page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>MissionMind API</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { text-align: center; padding: 2.5rem; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); max-width: 480px; }
          h1 { margin-top: 0; font-size: 1.75rem; color: #e2e8f0; }
          p { color: #94a3b8; font-size: 1rem; line-height: 1.5; }
          .status { display: inline-block; padding: 0.35rem 0.85rem; background: rgba(34, 197, 94, 0.15); color: #4ade80; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; }
          a.btn { display: inline-block; margin-top: 1.25rem; padding: 0.75rem 1.75rem; background: #6366f1; color: white; border-radius: 10px; text-decoration: none; font-weight: 600; }
          a.btn:hover { background: #4f46e5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="status">&#9679; Backend API Online</div>
          <h1>🚀 MissionMind API Service</h1>
          <p>The backend REST API is actively running and connected to MongoDB Atlas.</p>
          <a class="btn" href="https://missionmind-frontend.onrender.com">Open MissionMind Web App &rarr;</a>
        </div>
      </body>
    </html>
  `);
});

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
