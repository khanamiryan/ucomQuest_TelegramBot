const express = require('express');
const Location = require('./location.schema')
const LocationGames = require('./locationGame.schema')
const router = express.Router()

router.post('/', async (req, res) => {
  const newLocation = new Location(req.body);
  const location = await newLocation.save()
  res.json(location)
})
router.get('/', async (req, res) => {
  const locations = await Location.aggregate([
    {
      $lookup:
        {
          from: "locationgames",
          localField: "_id",
          foreignField: "locationId",
          as: "locationGames"
        }
    },
    {
      $lookup:
        {
          from: "games",
          localField: "locationGames.gameId",
          foreignField: "_id",
          as: "locationGames"
        }
    },
  ])
  res.json(locations)
})
router.delete('/:id', async (req, res) => {
  await Location.deleteOne({_id: req.params.id})
  res.json(true)
})

router.post('/addGameToLocation', async (req, res) => {
  await LocationGames.remove({
    locationId: req.body._id
  })
  for(const gameId of  req.body.games) {
    const locationGame = new LocationGames({
      locationId: req.body._id,
      gameId
    })
    await locationGame.save()
  }

  res.json(true)
})

module.exports = router;
