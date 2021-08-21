const {Telegraf} = require('telegraf');
const bot = new Telegraf(process.env.botToken, {
  polling: true,
});
const {showGameMenu, gameTo} = require('./game')
const interceptor = require('./interceptor')
const admin = require('./admin')
const {updateUser} = require("../user/user");
const {onText, onPhoto, onVideo} = require("./playerOnData");

bot.use(async (ctx, next) => interceptor(ctx, next))

bot.command('phone', (ctx) => {
  ctx.reply('Send me your number please', { reply_markup: { keyboard: [[{text: '📲 Send phone number', request_contact: true}]], resize_keyboard: true, one_time_keyboard: true  } })
})
bot.command('location', (ctx) => {
  ctx.reply('Send me your location please', { reply_markup: { keyboard: [[{text: 'send location', request_location: true}]], resize_keyboard: true, one_time_keyboard: true  } })
})
bot.on('contact', async (ctx) => {
  await updateUser({
    id: ctx.update.message.contact.user_id,
    data: {
      phone_number: +ctx.update.message.contact.phone_number,
    }
  })
  ctx.reply(`thank you our admins will contact you, by that number\n${ctx.update.message.contact.phone_number}`)
})

bot.on('location', async (ctx) => {
  console.log(123, ctx);
  // await updateUser({
  //   id: ctx.update.message.contact.user_id,
  //   data: {
  //     phone_number: +ctx.update.message.contact.phone_number,
  //   }
  // })
  ctx.reply(`thank you`)
})


bot.use(admin.middleware())

bot.command('admin', async ctx => adminPage(ctx))
bot.command('game', async ctx => showGameMenu(ctx.state.userId)) // open Games Menu
bot.command('start', async ctx => showGameMenu(ctx.state.userId)) // open Games Menu
bot.action(/^gTo/, async (ctx) => gameTo(ctx)) // gameTo

bot.on('text', async (ctx) => onText(ctx))
bot.on('photo', async (ctx) => onPhoto(ctx))
bot.on('video', async (ctx) => onVideo(ctx))

bot.action(/^textTo/, async (ctx) => {
  const [,userId, userCode] = ctx.update.callback_query.data.split(':')
  await updateUser({
    id: ctx.from.id,
    data: {
      chatTo: userId
    }
  })
  ctx.editMessageText(`now we chatting with ${userCode}`)
})
bot.action('back', async (ctx) => {
  await adminPage(ctx)
})
const adminPage = async (ctx) => {
  if (ctx.state.role === 'admin') {
    ctx.deleteMessage()
    await admin.replyToContext(ctx)
    return false
  }
}

bot.use(async (ctx, next) => {
  if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
    console.log('another callbackQuery happened', ctx.callbackQuery.data.length, ctx.callbackQuery.data)
  }
  return next()
})
module.exports = bot
