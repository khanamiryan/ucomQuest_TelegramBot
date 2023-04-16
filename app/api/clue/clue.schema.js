const mongoose = require('mongoose');
const clueSchema = new mongoose.Schema({

  name: { type: String, required: true },
  description: { type: String, required: true },
  fullDescription: { type: String, required: true },
  point: { type: Number, required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  locationFromGoogle: { type: String },
  clueType: { type: String, required: true },
  maxPlayersSameTime: { type: Number, required: true },
  playTime: { type: Number, required: true },
  clueCode: { type: String, default: '', required: false },
  nowPlaying: { type: Number, default: 0, required: false},
  fileName: {
    type: String
  },


},{
  versionKey: false,
  timestamps: true,});

clueSchema.virtual('id').get(function(){
  return this._id.toHexString();
});

clueSchema.virtual('location', {
  ref: 'Locations',
  localField: 'locationId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialised.
clueSchema.set('toJSON', {
  virtuals: true
});
// const clueSchemaOld = mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   fileName: {
//     type: String
//   },
//   clueCode: {
//     type: String,
//     required: true
//   },
//   clueType: {
//     type: String,
//     required: true
//   },
//   description: {
//     type: String,
//     required: true
//   },
//   fullDescription: {
//     type: String,
//     required: true
//   },
//   point: {
//     type: Number,
//     required: true
//   },
//   maxPlayerCount: {
//     type: Number,
//   },
//   nowPlaying: {
//     type: Number,
//     default: 0
//   },
//   gamePlayTime: {
//     type: Number,
//   },
//   location: {
//     type: String,
//   },
//   locationId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true
//   }
// }, {
//   versionKey: false,
//   timestamps: true,
// });

module.exports = mongoose.model('Clues', clueSchema);
