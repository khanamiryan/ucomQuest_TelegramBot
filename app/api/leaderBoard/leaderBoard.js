const express = require('express');
const Users = require('../user/user.schema')
const router = express.Router()

router.get('/', async (req, res) => {
  const aggregate = [
    {
      $match: {
        role: 'player',
        telegramId: { $exists: true}
      }
    },
    {
      $lookup:
        {
          from: "users",
          localField: "adminId",
          foreignField: "_id",
          as: "admin"
        }
    },
    {
      $addFields: {adminData: { $arrayElemAt: [ "$admin", 0 ] }}
    },
    {$project: {admin: 0}},
    {
      $lookup:
        {
          from: "locations",
          localField: "playingLocationId",
          foreignField: "_id",
          as: "location"
        }
    },
    {
      $addFields: {locationData: { $arrayElemAt: [ "$location", 0 ] }}
    },
    {
      $addFields: {locationName: "$locationData.name" },
    },
    {$project: {location: 0}},
    { $addFields: {  total: { $add: [ "$locationPoint", "$allPoint" ] }} },
    { $sort : { total : -1 } },
  ]
  const percent = await Users.aggregate([...aggregate,     {
    $group : {
      _id: null,
      max: { $max : "$total" },
      // min: { $min : "$total" }
    },
  }])
  const users = await Users.aggregate([...aggregate,
    {
      $addFields: {
        percent: 77 / (percent && percent[0] && percent[0].max) || 1
      }
    }])
  res.json(users)
})
router.get('/admins', (req, res) => {
  Users.find({role: 'admin'}).sort({role: -1}).then(r => {
    res.json(r)
  })
})

const getUserInfo = async (code) => {
  return Users.aggregate([
    {
      $match: {code}
    },
    {
      $lookup:
        {
          from: "locations",
          localField: "playingLocationId",
          foreignField: "_id",
          as: "location"
        }
    },
    {
      $addFields: {locationData: { $arrayElemAt: [ "$location", 0 ] }}
    },
    {$project: {location: 0}},
    {
      $lookup:
        {
          from: "games",
          localField: "playingGameId",
          foreignField: "_id",
          as: "game"
        }
    },
    {
      $addFields: {gameData: { $arrayElemAt: [ "$game", 0 ] }}
    },
    {$project: {game: 0}},
  ])
}

module.exports = {
  router,
};
