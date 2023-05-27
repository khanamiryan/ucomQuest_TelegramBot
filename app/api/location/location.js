const express = require('express');
const Location = require('./location.schema')
const router = express.Router()
const { upload } = require("../../multer");
// const storageConfig = multer.diskStorage({
//   destination: (req, file, cb) =>{
//     cb(null, "uploads");
//   },
//   filename: (req, file, cb) =>{
//     cb(null, file.originalname);
//   }
// });
// const upload = multer({ dest: 'public/', storage: storageConfig })

getLocation = async () => {
  return Location.find();
}

router.post('/', upload.single('file'),async (req, res) => {
  let body = req.body;

  if (req.file && req.file.filename) {
    body.fileName = req.file.filename
  }
  req.body && delete req.body._id

  const newLocation = new Location(req.body);
  const location = await newLocation.save()
  res.json(location)
})
router.put('/', upload.single('file'), async (req, res) => {
  let body = req.body;

  if (req.file && req.file.filename) {
    body.fileName = req.file.filename
  }
  const location = await Location.updateOne({_id: body._id}, body);
  res.json(location)
})
router.get('/', async (req, res) => {
  const locations = await getLocation()
  res.json(locations)
})
router.delete('/:_id', async (req, res) => {
  try {
    await Location.deleteOne({_id: req.params._id})
    res.json(true)
  } catch (e){
    res.json(false);
  }
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
