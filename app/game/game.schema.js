const mongoose = require('mongoose');

const gameSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  fullDescription: {
    type: String,
    required: true
  },
  point: {
    type: Number,
    required: true
  },
}, {
  versionKey: false,
  timestamps: true,
});

module.exports = mongoose.model('Games', gameSchema);
