// models/Task.js

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  list1: [{ type: String }],
  list2: [
    {
      importance: Number,
      idea: String,
    },
  ],
  list3: [
    {
      importance: Number,
      urgency: Number,
      idea: String,
    },
  ],
});

module.exports = mongoose.model('Task', taskSchema);
