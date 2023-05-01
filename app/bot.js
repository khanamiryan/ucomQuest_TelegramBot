const {Telegraf, session} = require("telegraf");
const {Mongo} = require("@telegraf/session/mongodb");
const bot = new Telegraf(process.env.botToken, {
    polling: true,
});


const store = Mongo({
    url: process.env.mongodb,
    collection: "sessions",
});


const ctxObj = { };


module.exports = {bot, store, ctxObj};