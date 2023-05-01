const express = require("express");
const router = express.Router();
const Router = require("./router");
router.use("/", Router);
const {bot} = require("./bot");

const mongoose = require("mongoose");


mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.mongodb, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {}
)
const db = mongoose.connection;

db.once("open", (db) => {
  console.log("Connected to MongoDB successfully!");

});
db.on("error", (err) => {
  console.log(err);
});



require("./telegramBot/index");

bot.catch((error) => {
  console.log("bot error", error);
});
bot.launch().then(() => {
  console.log("Connected to Telegram successfully!");
});



process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

module.exports = router;
