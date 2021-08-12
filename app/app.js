const express = require('express');
const router = express.Router()
const Router = require('./router')
router.use('/', Router)


const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/telegramBot', { useNewUrlParser: true, useUnifiedTopology: true  })
const db = mongoose.connection;

db.once('open', () => {
  console.log("Connected to MongoDB successfully!");
});
db.on('error', (err) => {
  console.log(err);
});

module.exports = router;
