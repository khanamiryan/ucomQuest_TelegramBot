const express = require('express');
const Games = require('./game.schema')
const router = express.Router()

router.post('/', async (req, res) => {
  const newGame = new Games(req.body);
  const game = await newGame.save()
  res.json(game)
})
router.get('/', async (req, res) => {
  const games = await Games.find()
  res.json(games)
})
router.delete('/:id', async (req, res) => {
  await Games.deleteOne({_id: req.params.id})
  res.json(true)
})

const getGameById = (id) => {
  return Games.findById(id)
}

module.exports = {
  getGameById,
  router
};
