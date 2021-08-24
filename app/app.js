const express = require('express');
const router = express.Router()
const Router = require('./router')
router.use('/', Router)
const bot = require('./telegramBot/index')


const mongoose = require('mongoose');
console.log(process.env.mongodb);
mongoose.connect(process.env.mongodb, { useNewUrlParser: true, useUnifiedTopology: true  })
const db = mongoose.connection;

db.once('open', () => {
  console.log("Connected to MongoDB successfully!");
});
db.on('error', (err) => {
  console.log(err);
});

bot.catch(error => {
  console.log('bot error', error)
})
bot.launch().then(() => {
  console.log("Connected to Telegram successfully!");
})

module.exports = router;
