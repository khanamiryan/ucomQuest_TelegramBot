const express = require('express');
const Games = require('./game.schema')
const router = express.Router()
const multer  = require('multer')
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) =>{
    cb(null, "uploads");
  },
  filename: (req, file, cb) =>{
    cb(null, file.originalname);
  }
});
const upload = multer({ dest: 'public/', storage: storageConfig })
router.post('/',  upload.single('file'), async (req, res) => {
  let body = req.body;
  if (req.file && req.file.filename) {
    console.log(req.file);
    body.fileName = req.file.filename
  }
  body && delete body._id
  const newGame = new Games(body);
  const game = await newGame.save()
  res.json(game)
})
router.put('/', upload.single('file'), async (req, res) => {
  let body = req.body;
  if (req.file && req.file.filename) {
    console.log(req.file);
    body.fileName = req.file.filename
  }
  console.log(req.file);
  console.log(body);
  const game = await Games.updateOne({_id: body._id}, body);
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
