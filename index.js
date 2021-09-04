// require('dotenv/config')
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const cors = require('cors')
const express = require("express");
const app = express();
const btoa = require('btoa');
const appRoute = require('./app/app')
const corsOpts = {
  origin: '*',

  methods: [
    'GET',
    'POST',
  ],

  allowedHeaders: [
    'Content-Type',
  ],
};
app.use(cors(corsOpts))
app.use(express.json())

app.use(express.urlencoded({ extended: true }))
app.use((req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  if(req.url === '/login' || req.url === '/leaderboard') {
    next()
  } else if (bearerHeader) {
    const [,bearer] = bearerHeader.split(' ');
    if (bearer === btoa(process.env.token)) {
      next();
    } else {
      res.status(400).send( 'missing authorization header');
    }
  } else {
    // Forbidden
    res.sendStatus(403);
  }
});
app.use(express.static('public'));
app.use("/", appRoute)
app.listen(process.env.port,  () => {
  console.log(`App is listening to port ${process.env.port}`);
});
