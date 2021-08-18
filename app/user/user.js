const express = require('express');
const Users = require('./user.schema')
const router = express.Router()

router.get('/', async (req, res) => {
  const users = await Users.aggregate([
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
    {$project: {location: 0}},
    { $sort : { role : -1 } }
  ])
  res.json(users)
})
router.get('/admins', (req, res) => {
  Users.find({role: 'admin'}).sort({role: -1}).then(r => {
    res.json(r)
  })
})
router.post('/', async (req, res) => {
  const code = await Users.findOne({code: req.body.code})
  if (code?.code) {
    res.json({error: 'use other code'})
  } else {
    const newUser = new Users({...req.body, ...req.body.admin});
    const user = await newUser.save()
    res.json(user)
  }
})
router.delete('/:id', async (req, res) => {
  await Users.deleteOne({_id: req.params.id})
  res.json(true)
})

module.exports = router;
