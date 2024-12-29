const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  hasPurchased: {
    type: Boolean,
    default: false
  },
  purchaseDate: {
    type: Date
  },
  stripeSessionId: {
    type: String
  },
  priceId: {
    type: String
  },
  amount: {
    type: Number
  },
  list1: {
    type: [String],
    default: []
  },
  list2: {
    type: [String],
    default: []
  },
  list3: {
    type: [String],
    default: []
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Purchase', purchaseSchema);