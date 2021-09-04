// require('dotenv/config')
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const cors = require('cors')
const express = require("express");
const app = express();
const btoa = require('btoa');
const appRoute = require('./app/app')
app.use(cors())
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});
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
