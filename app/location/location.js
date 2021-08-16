const express = require('express');
const Location = require('./location.schema')
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
          from: "games",
          localField: "games",
          foreignField: "_id",
          as: "locationGames"
        }
    }
  ])
  res.json(locations)
})
router.delete('/:id', async (req, res) => {
  await Location.deleteOne({_id: req.params.id})
  res.json(true)
})

router.post('/addGameToLocation', async (req, res) => {
  await Location.findByIdAndUpdate(req.body._id, {
    games: req.body.games
  })
  res.json(true)
})

module.exports = router;
