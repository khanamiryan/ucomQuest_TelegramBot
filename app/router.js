const express = require('express');
const router = express.Router()
const {router: userRouter} = require('./api/user/user')
const {router: gameRouter} = require('./api/game/game')
const {router: locationRouter} = require('./api/location/location')
const {router: fileRouter} = require('./api/file/file')

router.get('/', (req, res) => {
  res.send('app works')
})

router.use('/user', userRouter)
router.use('/location', locationRouter)
router.use('/game', gameRouter)
router.use('/file', fileRouter)

module.exports = router;
