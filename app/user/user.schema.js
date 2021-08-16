const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
  },
  username: {
    type: String,
  },
  id: {
    type: String,
    required: true,
    ensureIndex: true,
  },
  role: {
    type: String,
    required: true,
    default: 'player'
  },
  phone_number: {
    type: Number,
  },
  chatTo: {
    type: String,
  }
}, {
  versionKey: false,
  timestamps: true,
});

module.exports = mongoose.model('Users', userSchema);
