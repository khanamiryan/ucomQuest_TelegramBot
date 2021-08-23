const mongoose = require('mongoose');

const filesSchema = mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userTeamName: {
    type: String,
    required: true
  },
  userCode: {
    type: String,
    required: true,
  },
  gameName: {
    type: String,
  },
  gameLocation: {
    type: String,
  },
  fileType: {
    type: String
  },
  fileId: {
    type: String
  },
  fileHref: {
    type: String,
    required: true,
  }
}, {
  versionKey: false,
  timestamps: true,
});

module.exports = mongoose.model('files', filesSchema);
