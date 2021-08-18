const express = require('express');
const LocationGames = require('./locationGame.schema')
const Location = require('./location.schema')
const router = express.Router()

getLocation = async () => {
  let locations = await Location.aggregate([
    {
      $lookup:
        {
          from: "locationgames",
          localField: "_id",
          foreignField: "locationId",
          as: "games"
        }
    },
    {
      $lookup:
        {
          from: "games",
          localField: "games.gameId",
          foreignField: "_id",
          as: "locationGames"
        }
    },
  ])
  locations = locations.map(location => {
    location.locationGames = location.locationGames.map(( locGames) => {
      let gameLocations = '';
      location.games.map((game) => {
        if (game.gameId.toString() === locGames._id.toString()) {
          gameLocations = game.location
        }
      })
      return {
        ...locGames,
        location: gameLocations
      }
    })
    return location
  })
  return locations
}

router.post('/', async (req, res) => {
  const newLocation = new Location(req.body);
  const location = await newLocation.save()
  res.json(location)
})
router.get('/', async (req, res) => {
  const locations = await getLocation()
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
  for(const game of  req.body.games) {
    const locationGame = new LocationGames({
      locationId: req.body._id,
      gameId: game.gameId,
      location: game.location,
    })
    await locationGame.save()
  }

  res.json(true)
})

module.exports = {router, getLocation};
