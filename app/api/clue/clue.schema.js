const mongoose = require('mongoose');

const clueSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  fileName: {
    type: String
  },
  gameCode: {
    type: String,
    required: true
  },
  gameType: {
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
  maxPlayerCount: {
    type: Number,
  },
  nowPlaying: {
    type: Number,
    default: 0
  },
  gamePlayTime: {
    type: Number,
  },
  location: {
    type: String,
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
}, {
  versionKey: false,
  timestamps: true,
});

module.exports = mongoose.model('Clues', clueSchema);
