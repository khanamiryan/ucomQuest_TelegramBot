const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
  },
  username: {
    type: String,
  },
  id: {
    type: String,
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
  },
  code: {
    type: String,
  }
}, {
  versionKey: false,
  timestamps: true,
});

module.exports = mongoose.model('Users', userSchema);
