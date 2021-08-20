const mongoose = require('mongoose');

const locationGameSchema = mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  location: {
    type: String,
  },
}, {
  versionKey: false,
  timestamps: true,
});

module.exports = mongoose.model('LocationGames', locationGameSchema);
