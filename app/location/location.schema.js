const mongoose = require('mongoose');

const locationSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  games: {
    type: [mongoose.Schema.Types.ObjectId]
  }
}, {
  versionKey: false,
  timestamps: true,
});

module.exports = mongoose.model('Locations', locationSchema);
