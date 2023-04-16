const express = require('express');
const GameConfig = require('./gameConfig.schema')
const router = express.Router();



// Create a new game config object
router.post('/gameConfig', async (req, res) => {
    const gameConfig = new GameConfig(req.body);
    try {
        await gameConfig.save();
        res.send(gameConfig);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Get the current game config object
router.get('/gameConfig', async (req, res) => {
    try {
        const gameConfig = await GameConfig.findOne();
        res.send(gameConfig);
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;

