const {Telegraf} = require('telegraf');
const schedule = require('node-schedule')
const bot = new Telegraf(process.env.botToken, {
  polling: true,
});
const {showGameMenu, gameTo, showInfo, sendWelcomeMessage} = require('./game')
const interceptor = require('./interceptor')
const {menuMiddleware: admin, adminPage, showAdminInfo} = require('./admin')
const {onText, onPhoto, onVideo, actionTextTo, onContact, onLocation, onFile, onlyForward} = require("./playerOnData");
const {scheduleFunction} = require("./schedule");

bot.use(async (ctx, next) => interceptor(ctx, next))

// bot.command('phone', (ctx) => {
//   ctx.reply('Send me your number please', { reply_markup: { keyboard: [[{text: '📲 Send phone number', request_contact: true}]], resize_keyboard: true, one_time_keyboard: true  } })
// })
// bot.command('location', (ctx) => {
//   ctx.reply('Send me your location please', { reply_markup: { keyboard: [[{text: 'send location', request_location: true}]], resize_keyboard: true, one_time_keyboard: true  } })
// })
bot.on('contact', async (ctx) => onContact(ctx))
bot.on('location', async (ctx) => onLocation(ctx))


bot.use(admin.middleware())

bot.command('admin', async ctx => adminPage(ctx))
// bot.command('name', async ctx => editTeamName(ctx))
bot.command('game', async ctx => showGameMenu(ctx.state.userId)) // open Games Menu
bot.command('start', async ctx => sendWelcomeMessage(ctx)) // open Games Menu
bot.command('points', async ctx => showInfo(ctx)) // open Games Menu
bot.command('info', async ctx => showInfo(ctx)) // open Games Menu
bot.command('help', async ctx => showAdminInfo(ctx)) // open Games Menu
bot.action(/^gTo/, async (ctx) => gameTo(ctx)) // gameTo

bot.on('text', async (ctx) => onText(ctx))
bot.on('photo', async (ctx) => onPhoto(ctx))
bot.on('video', async (ctx) => onVideo(ctx))
bot.on('document', (ctx) => onFile(ctx))
bot.on('message', (ctx) => onlyForward(ctx))

bot.action(/^textTo/, async (ctx) => actionTextTo(ctx))
bot.action('back', async (ctx) => adminPage(ctx));
bot.use(async (ctx, next) => {
  if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
    console.log('another callbackQuery happened', ctx.callbackQuery.data.length, ctx.callbackQuery.data)
  }
  return next()
})


schedule.scheduleJob('* * * * *', () => {
  // schedule.scheduleJob('*/10 * * * * *', () => {
  scheduleFunction(bot).then()
})



module.exports = bot
