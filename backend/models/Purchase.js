const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  hasPurchased: {
    type: Boolean,
    default: false,
    required: true
  },
  purchaseDate: {
    type: Date
  },
  stripeSessionId: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Purchase', purchaseSchema);