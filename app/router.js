const express = require('express');
const router = express.Router()
const {router: userRouter} = require('./user/user')
const {router: gameRouter} = require('./game/game')
const {router: locationRouter} = require('./location/location')

router.get('/', (req, res) => {
  res.send('app works')
})

router.use('/user', userRouter)
router.use('/location', locationRouter)
router.use('/game', gameRouter)

module.exports = router;
