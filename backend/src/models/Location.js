const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  },
  floor: {
    type: Number,
    default: 1,
  },
  category: {
    type: String,
    enum: ['Academic', 'Food', 'Parking', 'Events', 'Administrative', 'Other'],
    default: 'Other',
  },
  icon: {
    type: String,
    default: '📍',
  },
  isDestination: {
    type: Boolean,
    default: true,
  },
  connections: [
    {
      type: String,
      ref: 'Location',
    },
  ],
}, {
  timestamps: true,
});

// Index for faster queries
locationSchema.index({ x: 1, y: 1 });

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;

