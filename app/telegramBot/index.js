const {Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.botToken, {
  polling: true,
});
const {game, gameTo} = require('./game')
const buttonsTemplate = require('./buttonsTemplate')
const interceptor = require('./interceptor')
const admin = require('./admin')
const {updateUser} = require("../user/user");
const {onText, onPhoto} = require("./playerOnData");

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


// bot.use(GameMenu.middleware())
bot.use(buttonsTemplate.middleware())
bot.use(admin.middleware())

bot.command('templates', async ctx => buttonsTemplate.replyToContext(ctx))
bot.command('admin', async ctx => adminPage(ctx))
// bot.command('game', async ctx => GameMenu.replyToContext(ctx))

bot.command('game', async ctx => game({ctx})) // open Games Menu
bot.action(/^gTo/, async (ctx) => gameTo(ctx)) // gameTo

bot.on('text', async (ctx) => onText(ctx, bot))
bot.on('photo', async (ctx) => onPhoto(ctx, bot))

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

//
// const menuTemplate = new MenuTemplate<MyContext>(ctx => `Hey ${ctx.from.first_name}!`)
//
// menuTemplate.interact('I am excited!', 'a', {
//   do: async ctx => {
//     await ctx.reply('As am I!')
//     return false
//   }
// })
//
// bot.on('sticker', (ctx) => ctx.reply('👍'))
// const inlineMessageRatingKeyboard = JSON.stringify({ inline_keyboard: [
//     [
//       { text: 'button 1', callback_data: 'like' },
//     ],
//     [
//       { text: 'button 2', callback_data: 'like' },
//       { text: 'button 2', callback_data: 'like' },
//       { text: 'button 2', callback_data: 'like' },
//     ],
//     [
//       { text: 'button 3', callback_data: 'like' },
//       { text: 'button 3', callback_data: 'like' },
//       { text: 'button 3', callback_data: 'like' },
//       { text: 'button 3', callback_data: 'aaa' },
//     ],
//   ],
//   resize_keyboard: true,
//   one_time_keyboard: true,
//   force_reply: true,
// });
// bot.command('start', async (ctx) => {
//   ctx.reply('buttons', { reply_markup: inlineMessageRatingKeyboard })
// })
//
// bot.action('like', (ctx) => ctx.editMessageReplyMarkup(inlineMessageRatingKeyboard))
// bot.action('aaa', (ctx) => ctx.reply('buttons', { reply_markup: inlineMessageRatingKeyboard }))
//
//
//
// // bot.on('text', (ctx) => {
// //   return ctx.reply(`Hello ${ctx.state.role}`)
// // })
// // bot.telegram.sendMessage(ctx.chat.id, 'hello there! Welcome to my new telegram bot.', {
// // })
//
// bot.on('photo', (ctx) => {
//   // bot.telegram.sendPhoto(ctx.chat.id, 'https://www.kindpng.com/picc/m/12-122875_transparent-younglife-logo-png-young-life-logo-yl.png')
//   ctx.replyWithPhoto('https://www.kindpng.com/picc/m/12-122875_transparent-younglife-logo-png-young-life-logo-yl.png')
// })
//
//

bot.use(async (ctx, next) => {
  if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
    console.log('another callbackQuery happened', ctx.callbackQuery.data.length, ctx.callbackQuery.data)
  }
  return next()
})
module.exports = bot
