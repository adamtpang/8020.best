const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  userId: {
    type: String,
    sparse: true
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
  list1: [String],
  list2: [{
    importanceValue: Number,
    idea: String
  }],
  list3: [{
    importanceValue: Number,
    urgencyValue: Number,
    idea: String
  }],
  list4: {
    type: Array,
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Purchase', purchaseSchema);