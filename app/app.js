const express = require("express");
const router = express.Router();
const Router = require("./router");
router.use("/", Router);
const bot = require("./telegramBot/index");
const mongoose = require("mongoose");
const db1 =
  // "mongodb+srv://tigran:VLHRmFGSMPiBGywU@cluster0.e6ns0do.mongodb.net/?retryWrites=true&w=majority&ssl=true";

  console.log(process.env.MONGODB);
mongoose.connect(
  process.env.MONGODB,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // ssl: true,
    // sslValidate: true,
    // sslCA: require("fs").readFileSync(`${__dirname}/ca-certificate.crt`),
  },
  () => {}
);
const db = mongoose.connection;

db.once("open", () => {
  console.log("Connected to MongoDB successfully!");
});
db.on("error", (err) => {
  console.log(err);
});

bot.catch((error) => {
  console.log("bot error", error);
});
bot.launch().then(() => {
  console.log("Connected to Telegram successfully!");
});

module.exports = router;
