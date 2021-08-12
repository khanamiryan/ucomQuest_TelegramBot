const {Telegraf, Markup } = require('telegraf');
const Users = require('../user/user.schema')
const bot = new Telegraf(process.env.botToken);

bot.on('sticker', (ctx) => ctx.reply('👍'))
const inlineMessageRatingKeyboard = [[
  { text: '👍', callback_data: 'like' },
  { text: '👎', callback_data: 'dislike' }
]];
bot.command('start', async (ctx) => {
  ctx.reply('buttons', { reply_markup: JSON.stringify({ inline_keyboard: inlineMessageRatingKeyboard }) })
})

bot.action('like', (ctx) => ctx.editMessageText('🎉 Awesome! 🎉'))
bot.action('dislike', (ctx) => ctx.editMessageText('okey'))


const getUser = async (id) => {
  return Users.findOne({id});
}

bot.use(async (ctx, next) => {
  let user = await getUser(ctx.from.id)
  if(!user) {
    user = new Users(ctx.from)
    await user.save()
  }
  ctx.state.role = user.role;
  return next()
})

// bot.on('text', (ctx) => {
//   return ctx.reply(`Hello ${ctx.state.role}`)
// })
// bot.telegram.sendMessage(ctx.chat.id, 'hello there! Welcome to my new telegram bot.', {
// })

bot.on('photo', (ctx) => {
  // bot.telegram.sendPhoto(ctx.chat.id, 'https://www.kindpng.com/picc/m/12-122875_transparent-younglife-logo-png-young-life-logo-yl.png')
  ctx.replyWithPhoto('https://www.kindpng.com/picc/m/12-122875_transparent-younglife-logo-png-young-life-logo-yl.png')
})



module.exports = bot
