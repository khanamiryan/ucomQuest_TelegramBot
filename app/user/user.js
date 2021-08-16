const express = require('express');
const Users = require('./user.schema')
const router = express.Router()

router.get('/', (req, res) => {
  Users.find().sort({role: -1}).then(r => {
    res.json(r)
  })
})
router.post('/', async (req, res) => {
  const code = await Users.findOne({code: req.body.code})
  if (code?.code) {
    res.json({error: 'use other code'})
  } else {
    const newUser = new Users(req.body);
    const user = await newUser.save()
    res.json(user)
  }

})
router.delete('/:id', async (req, res) => {
  await Users.deleteOne({_id: req.params.id})
  res.json(true)
})

module.exports = router;
