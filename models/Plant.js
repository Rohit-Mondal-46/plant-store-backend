const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  categories: [{
    type: String,
    required: true,
    trim: true,
    lowercase: true
  }],
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  description: {
    type: String,
    maxlength: 500
  },
  image: {
    type: String,
    default: 'https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  light: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  }
  
}, {
  timestamps: true
});

// Index for search functionality
plantSchema.index({ name: 'text', categories: 'text', description: 'text' });

module.exports = mongoose.model('Plant', plantSchema);