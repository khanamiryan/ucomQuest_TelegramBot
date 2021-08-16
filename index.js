require('dotenv/config')
const cors = require('cors')
const express = require("express");
const app = express();
const appRoute = require('./app/app')
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/", appRoute)

app.listen(process.env.port,  () => {
  console.log(`App is listening to port ${process.env.port}`);
});
