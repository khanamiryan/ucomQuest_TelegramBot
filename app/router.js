const express = require('express');
const router = express.Router()
const userRouter = require('./user/user')
const gameRouter = require('./game/game')
const {router: locationRouter} = require('./location/location')

router.get('/', (req, res) => {
  res.send('app works')
})

router.use('/user', userRouter)
router.use('/location', locationRouter)
router.use('/game', gameRouter)

module.exports = router;
