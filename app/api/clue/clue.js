const express = require('express');
const Clues = require('./clue.schema')
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
  console.log('body', body)
  if (req.file && req.file.filename) {
    body.fileName = req.file.filename
  }
  body && delete body._id && delete body.id
  const newGame = new Clues(body);
  const game = await newGame.save()
  res.json(game)
})
router.put('/', upload.single('file'), async (req, res) => {
  let body = req.body;
  if (req.file && req.file.filename) {
    body.fileName = req.file.filename
  }
  delete body.id
  //update and return the updated document
  const game = await Clues.updateOne({_id: body._id}, body);

  res.json(game)
})
router.get('/', async (req, res) => {
  // console.log(req, res);
  let clues = await Clues.aggregate([
    {
      $lookup:
        {
          from: "locations",
          localField: "location",
          foreignField: "_id",
          as: "locationData"
        }
    },
    {
      $addFields: {locationName: { $arrayElemAt: [ "$locationData.name", 0 ] }}
    },
    {$project: {locationData: 0}},
  ])
  // let clues  = await Clues.find();
  // games = await Promise.all(games.map(async game => {
  //   if(game.fileName) {
  //     return {
  //       ...game,
  //       fileType: await getFileType(game.fileName),
  //       fileData: getFile(game.fileName),
  //     }
  //   }
  //   return game
  // }))
  res.json(clues)
})
router.delete('/:_id', async (req, res) => {
  try {
    await Clues.findByIdAndDelete({_id: req.params._id})
    res.json(true)
  }catch (e) {
    console.log(e)
    res.json(false)
  }
})

const getClueById = (id) => {
  try {
    return Clues.findById(id)
  }catch (e) {
    console.log(e)
    return null
  }
}
const updateClue = (filter, data) => {
  try {
    return Clues.updateOne(filter, data)
  }catch (e) {
    console.log(e)
    return null
  }
}

module.exports = {
  Clues,
  getClueById,
  updateClue,
  router
};
