const express = require('express');
const Games = require('./game.schema')
const router = express.Router()

router.post('/', async (req, res) => {
  delete req.body && req.body._id
  const newGame = new Games(req.body);
  const game = await newGame.save()
  res.json(game)
})
router.put('/', async (req, res) => {
  const game = await Games.updateOne({_id: req.body._id}, req.body);
  res.json(game)
})
router.get('/', async (req, res) => {
  const games = await Games.aggregate([
    {
      $lookup:
        {
          from: "locations",
          localField: "locationId",
          foreignField: "_id",
          as: "locationData"
        }
    },
    {
      $addFields: {locationName: { $arrayElemAt: [ "$locationData.name", 0 ] }}
    },
    {$project: {locationData: 0}},
  ])
  res.json(games)
})
router.delete('/:id', async (req, res) => {
  await Games.deleteOne({_id: req.params.id})
  res.json(true)
})

const getGameById = (id) => {
  return Games.findById(id)
}
const updateGame = (filter, data) => {
  return Games.updateOne(filter, data)
}

module.exports = {
  Games,
  getGameById,
  updateGame,
  router
};
