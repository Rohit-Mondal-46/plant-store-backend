const express = require('express');
const mongoose = require('mongoose');
const Plant = require('../models/Plant');

const router = express.Router();

// Helper function to check if MongoDB is available
const isMongoAvailable = () => {
  return mongoose.connection.readyState === 1;
};

// GET all plants with search and filter
router.get('/', async (req, res) => {
  try {
    const { search, category, inStock } = req.query;
    
    if (!isMongoAvailable()) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database is not available at this time. Please try again later.' 
      });
    }
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { categories: { $elemMatch: { $regex: search, $options: 'i' } } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Category filter - support multiple categories
    if (category) {
      let categories;
      if (Array.isArray(category)) {
        categories = category.map(cat => cat.toLowerCase());
      } else if (typeof category === 'string') {
        // Handle comma-separated string or single category
        categories = category.split(',').map(cat => cat.trim().toLowerCase()).filter(cat => cat);
      }
      
      if (categories && categories.length > 0) {
        query.categories = { $in: categories };
      }
    }
    
    // Stock filter
    if (inStock !== undefined) {
      if (inStock === 'true') {
        query.quantity = { $gt: 0 };
      } else {
        query.quantity = 0;
      }
    }
    
    const plants = await Plant.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: plants });
    
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.status(500).json({ success: false, message: 'Error fetching plants' });
  }
});

// GET single plant
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isMongoAvailable()) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database is not available at this time. Please try again later.' 
      });
    }
    
    const plant = await Plant.findById(id);
    if (!plant) {
      return res.status(404).json({ success: false, message: 'Plant not found' });
    }
    res.json({ success: true, data: plant });
    
  } catch (error) {
    console.error('Error fetching plant:', error);
    res.status(500).json({ success: false, message: 'Error fetching plant' });
  }
});

// POST new plant (Admin)
router.post('/', async (req, res) => {
  try {
    const { name, price, categories, quantity, description, image, light } = req.body;
    
    if (!isMongoAvailable()) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database is not available at this time. Please try again later.' 
      });
    }
    
    // Validation
    if (!name || !price || !categories || categories.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, price, and at least one category are required' 
      });
    }
    
    if (price < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Price must be a positive number' 
      });
    }
    
    if (quantity !== undefined && (quantity < 0 || !Number.isInteger(Number(quantity)))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quantity must be a non-negative integer' 
      });
    }
    
    const plantData = {
      name: name.trim(),
      price: parseFloat(price),
      categories: categories.map(cat => cat.toLowerCase().trim()),
      quantity: quantity !== undefined ? parseInt(quantity) : 0,
      description: description?.trim() || '',
      image: image || 'https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg?auto=compress&cs=tinysrgb&w=400',
      light: light || 'Medium'
    };
    
    const plant = new Plant(plantData);
    await plant.save();
    res.status(201).json({ success: true, data: plant });
    
  } catch (error) {
    console.error('Error creating plant:', error);
    res.status(500).json({ success: false, message: 'Error creating plant' });
  }
});

// POST purchase plant
router.post('/:id/purchase', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity = 1 } = req.body;
    
    if (!isMongoAvailable()) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database is not available at this time. Please try again later.' 
      });
    }
    
    // Validation
    if (quantity < 1 || !Number.isInteger(Number(quantity))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Purchase quantity must be a positive integer' 
      });
    }
    
    const plant = await Plant.findById(id);
    if (!plant) {
      return res.status(404).json({ success: false, message: 'Plant not found' });
    }
    
    if (plant.quantity < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Only ${plant.quantity} items available in stock` 
      });
    }
    
    plant.quantity -= quantity;
    await plant.save();
    
    res.json({ 
      success: true, 
      data: plant,
      message: `Successfully purchased ${quantity} ${plant.name}(s)` 
    });
    
  } catch (error) {
    console.error('Error purchasing plant:', error);
    res.status(500).json({ success: false, message: 'Error processing purchase' });
  }
});

// GET categories for filter dropdown
router.get('/meta/categories', async (req, res) => {
  try {
    if (!isMongoAvailable()) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database is not available at this time. Please try again later.' 
      });
    }
    
    const categories = await Plant.distinct('categories');
    res.json({ success: true, data: categories });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Error fetching categories' });
  }
});

module.exports = router;