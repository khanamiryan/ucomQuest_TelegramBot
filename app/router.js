const express = require('express');
const router = express.Router()
const userRouter = require('./user/user')

router.get('/', (req, res) => {
  res.send('app works')
})

router.use('/user', userRouter)

module.exports = router;
