// db.js

const mongoose = require('mongoose');

//uri to connect mongo atlas
const MONGO_URL = 'mongodb+srv://AlokDubey:Alokdubey%401996@cluster0.jhfg5qp.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

db.once('open', () => {
  console.log('Connected to MongoDB Atlas');
});

module.exports = db;
