// require('dotenv/config')
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const cors = require("cors");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const btoa = require("btoa");
const appRoute = require("./app/app");
app.use(express.json());
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (req.url === "/login" || req.url === "/leaderboard"|| req.url==="/clue"|| req.url==="/game") {
    next();
  } else if (bearerHeader) {
    const [, bearer] = bearerHeader.split(" ");
    if (bearer === btoa(process.env.token)) {
      next();
    } else {
      res.status(400).send("missing authorization header");
    }
  } else {
    // Forbidden
    res.sendStatus(403);
  }
});
app.use(express.static("public"));
app.use("/", appRoute);
app.listen(process.env.port, () => {
  console.log(`App is listening to port ${process.env.port}`);
});
