const mongoose = require('mongoose');

const messagesSchema = mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  messageId: {
    type: String,
    required: true
  },
  messagesType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'active',
  },
  text: {
    type: String,
  }
}, {
  versionKey: false,
  timestamps: true,
});

module.exports = mongoose.model('Messages', messagesSchema);
