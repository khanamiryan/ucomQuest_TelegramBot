const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  teamName: {
    type: String,
  },
  telegramId: {
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
  code: { //verification code
    type: String,
  },
  verificationCode: {
    type: String,
  },
  playingLocationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  playingLocationSteps: {
    type: [mongoose.Schema.Types.ObjectId],
  },
  playingLocationCurrentStep: {
    type: Number,
    default: -1,
    required: false,
  },
  // playingLocationStepsNames: {
  //   type: [String]
  // },
  playingGameId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  playingGameTime: {
    type: Date,
  },
  playingLocationTime: {
    type: Date,
  },
  playedGames: {
    type: [String],
  },
  playStatus: {
    type: String,
    default: async function (){
      if(this.playingLocationId){
         const location = await Location.findById(this.playingLocationId.toString());
         if(location.needToGoBeforeStart){
           return 'goingLocation';
         }else {
           return 'playingGame';
         }
      }
    }
  },
  locationPoint: {
    type: Number,
    default: 0,
  },
  allPoint: {
    type: Number,
    default: 0,
  },
  // updatingTeamName: {
  //   type: Boolean,
  //   default: false
  // }
}, {
  versionKey: false,
  timestamps: true,
});
userSchema.virtual('adminChatId').get(async function(){
  if(this.role === 'player') {
    const admin = await User.findById(this.adminId.toString());
    return admin.telegramId;
  }else {
    return this.chatTo;
  }
});

// userSchema.virtual("playingLocationId").get(function () {
//
//         return this.playingLocationSteps[this.playingLocationCurrentStep]||this.playingLocationSteps[0];
//
// });
module.exports = mongoose.model('Users', userSchema);
