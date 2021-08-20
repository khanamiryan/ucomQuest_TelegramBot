const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  teamName: {
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
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  chatTo: {
    type: String,
  },
  code: {
    type: String,
  },
  verificationCode: {
    type: String,
  },
  playingLocationId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  playingLocationSteps: {
    type: [mongoose.Schema.Types.ObjectId],
  },
  playingLocationStepsNames: {
    type: [String]
  },
  playingGameId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  playedGames: {
    type: [String],
  },
  playStatus: {
    type: String,
  }
}, {
  versionKey: false,
  timestamps: true,
});

module.exports = mongoose.model('Users', userSchema);
