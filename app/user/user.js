const express = require('express');
const Users = require('./user.schema')
const router = express.Router()

router.get('/:first_name', (req, res) => {
  Users.find({
    first_name: req.params.first_name,
  }).then(r => {
    res.json(r)
  })
})

module.exports = router;
