const mongoose = require('mongoose');
const gameConfigSchema = new mongoose.Schema({
    startDescription: { type: String, required: true },
    endDescription: { type: String, required: true },

});

module.exports = mongoose.model('GameConfig', gameConfigSchema);
