const mongoose = require("mongoose");
const Location = require("../location/location.schema");

const userSchema = mongoose.Schema(
    {
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
        default: "player",
      },
      phone_number: {
        type: Number,
      },
      adminId: {
        type: mongoose.Schema.Types.ObjectId,
        required: function () {
          return this.role === "player";
        },
      },
      chatTo: {
        type: String,
      },
      code: {
        //verification code
        type: String,
      },
      verificationCode: {
        type: String,
      },
      playingLocationSteps: {
        type: [mongoose.Schema.Types.ObjectId],
      },
      // playingLocationId: {
      //   type: mongoose.Schema.Types.ObjectId,
      //   required: true,
      //   default: function () {
      //     if (this.playingLocationSteps && this.playingLocationSteps.length > 0) {
      //       return this.playingLocationSteps[0];
      //     } else {
      //       // return a default value if playingLocationSteps is empty or undefined
      //       return null;
      //     }
      //   }
      // },

      playingLocationCurrentStep: {
        type: Number,
        default: 0,
        required: false,
      },
      // playingLocationStepsNames: {
      //   type: [String]
      // },
      // playingClueId: {
      //   type: mongoose.Schema.Types.ObjectId,
      //   required: false,
      // },
      playingClueTime: {
        type: Date,
      },
      playingLocationTime: {
        type: Date,
      },
      // playedGames: {
      //   type: [String],
      // },
      playStatus: {
        //todo change to enum or const
        type: String,
        required: function () {
          return this.role === "player";
        },
        default: function () {
          if (this.role !== "player") {
            return "";
          }
        },
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
    },
    {
      versionKey: false,
      timestamps: true,
    }
);


// userSchema.virtual('adminChatId').get(async function(){
//   if(this.role === 'player') {
//     const admin = await this.findById(this.adminId);
//     return admin.telegramId;
//   }else {
//     return this.chatTo;
//   }
// });

userSchema.virtual("playingLocationId2",{
    ref: 'Locations', // reference to Report model
    localField: 'playingLocationId', // matches field Comment Schema has named 'replies'
    // match: { _id: this.playingLocationSteps }, // matches field Comment Schema has named 'replies'
    foreignField: '_id', // matches field Report Schema has named 'comment' (foreign key in Report model)
    justOne: true, // this is going to return all related documents, not just one (just like reportCount)
})
userSchema
    .virtual("playingLocationId")
    .get(function () {
      return (
          this.playingLocationSteps[this.playingLocationCurrentStep - 1] || this.playingLocationSteps[0]
      );
    })
    .set(function (value) {
      this.playingLocationCurrentStep = 1 + this.playingLocationSteps.indexOf(value);
    });

// userSchema.virtual("playStatus").get(async function () {
//   // const loc = await getLocationDataById(this.playingLocationId);
//   if(this.playingClueId){
//       const clue = await getClueById(this.playingClueId);
//       if(clue.clueType==='levelUp'){
//          return 'playingLevelUp'
//       }else {
//             return 'playingClue';
//       }
//   }else {
//       return 'goingLocation';
//
//   }
//
// });
// userSchema.virtual("currentLocation",{
//   ref: 'Locations', // reference to Report model
//   localField: 'playingLocationId', // matches field Comment Schema has named 'replies'
//   foreignField: '_id', // matches field Report Schema has named 'comment' (foreign key in Report model)
//   justOne: true, // this is going to return all related documents, not just one (just like reportCount)
//   // ??count: true, // set it to true so it returns a number instead of an array of documents
// })
//     .get(async function () {
//   await Loca
//   this.populate('currentLocation');
// })

userSchema.set("toJSON", {
    virtuals: true,
});
userSchema.set("toObject", {
    virtuals: true,
});
userSchema.pre("post", async function (next) {
  if (this.role !== "player") return next();

  if (this.playingLocationId && !this.playStatus) {
    const location = await Location.findById(this.playingLocationId);
    if (location.needToGoBeforeStart) {
      this.playStatus = "goingLocation";
    } else {
      this.playStatus = "playingClue";
    }
  }
});

const Users = mongoose.model("Users", userSchema);


module.exports = Users;
