const express = require('express');
const Location = require('./location.schema')
const router = express.Router()

getLocation = async () => {
  return Location.find();
}

router.post('/', async (req, res) => {
  delete req.body._id;
  const newLocation = new Location(req.body);
  const location = await newLocation.save()
  res.json(location)
})
router.put('/', async (req, res) => {
  const location = await Location.updateOne({_id: req.body._id}, req.body);
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

// router.post('/addGameToLocation', async (req, res) => {
//   await LocationGames.remove({
//     locationId: req.body._id
//   })
//   for(const game of  req.body.games) {
//     const locationGame = new LocationGames({
//       locationId: req.body._id,
//       gameId: game.gameId,
//       location: game.location,
//     })
//     await locationGame.save()
//   }
//
//   res.json(true)
// })

const getLocationGameData = (_id) => {
  // return LocationGames.aggregate([
  //   {
  //     $match: {_id}
  //   },
  //   {
  //     $lookup:
  //       {
  //         from: "games",
  //         localField: "gameId",
  //         foreignField: "_id",
  //         as: "game"
  //       }
  //   },
  //   {
  //     $addFields: {gameData: { $arrayElemAt: [ "$game", 0 ] }}
  //   },
  //   {$project: {game: 0}},
  // ])
}
const getLocationDataById = (id) => {
  return Location.findById(id)
}

module.exports = {
  router,
  getLocationDataById,
  getLocation,
  getLocationGameData
};
