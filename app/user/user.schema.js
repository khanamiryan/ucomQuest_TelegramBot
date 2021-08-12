const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
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
  }
}, {
  versionKey: false,
  timestamps: true,
});

module.exports = mongoose.model('Users', userSchema);
