const express = require('express');
const btoa = require('btoa');
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
router.post('/login', (req, res) => {
  if (req.body.name === process.env.loginUserName && req.body.password === process.env.loginUserPassword) {
    res.send({token: btoa(process.env.token)
    })
  } else {
    res.status(400).send(`user not found ${req.body.name}, ${req.body.password}`)
  }
})

module.exports = router;
