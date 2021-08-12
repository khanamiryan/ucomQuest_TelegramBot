require('dotenv/config')
const express = require("express");
const app = express();
const appRoute = require('./app/app')
app.use("/", appRoute)

app.listen(process.env.port);
console.log(`app listen on port ${process.env.port}\n`);
