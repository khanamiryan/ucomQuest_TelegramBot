const mongoose = require('mongoose');

const locationSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  startDescription: {
    type: String,
    required: false
  },
  locationFromGoogle: {
    type: String,
    required: false
  },
  finishPoint: {
    type: Number,
    required: true
  },
  finishTime: {
    type: Number,
    required: false
  },
  fileName: {
    type: String,
    required: false
  },
  needToGoBeforeStart: {
    type: Boolean,
    required: false,
    default: true
  }
}, {
  versionKey: false,
  timestamps: true,
});

locationSchema.virtual('id').get(function(){
  return this._id.toHexString();
});

// Ensure virtual fields are serialised.
locationSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Locations', locationSchema);
