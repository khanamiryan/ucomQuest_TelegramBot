const mongoose = require('mongoose');

let userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
}, {
  versionKey: false,
  timestamps: true,
});

module.exports = mongoose.model('Users', userSchema);
