const express = require('express');
const Users = require('./user.schema')
const router = express.Router()

router.get('/:name', (req, res) => {
  const user = new Users({
    name: req.params.name,
  })
  user.save().then(r => {
    res.json(r)
  })
})


// router.get('/users', (req, res) => {
//   const user = new Users({
//     name: req.params.name,
//   })
//   res.send('user works')
// })


module.exports = router;
