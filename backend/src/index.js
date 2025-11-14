const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const locationRouter = require('./routes/locationRouter');
const routeRouter = require('./routes/routeRouter');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ar-navigation', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'AR Navigation API',
    version: '1.0.0',
    endpoints: {
      'Get Location': 'GET /api/location/:id',
      'Get Destinations': 'GET /api/location/destinations',
      'Get All Locations': 'GET /api/location',
      'Calculate Route': 'POST /api/route',
    },
  });
});

app.use('/api/location', locationRouter);
app.use('/api', routeRouter);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});

module.exports = app;

