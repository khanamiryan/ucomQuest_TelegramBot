const myCommands = {
  stop: 'chatting is stop',
  player: 'playerInfo'
}

const {Telegraf } = require('telegraf');
const Users = require('../user/user.schema')
const bot = new Telegraf(process.env.botToken, {
  polling: true,
});
const {game, gameTo} = require('./game')
const buttonsTemplate = require('./buttonsTemplate')
const admin = require('./admin')

bot.use(async (ctx, next) => {
  let user = await getUserById(ctx.from.id)
  if(!user) {
    const code = await getUserByCode(ctx.message.text)
    if (code) {
      if (code.id) {
        return false
      }
      await Users.updateOne({code: ctx.message.text}, ctx.from)
      await ctx.reply('you are connected')
      user = await getUserById(ctx.from.id)
    } else {
      await ctx.reply('please insert CODE')
      return false
    }
  }
  ctx.state.role = user.role;
  ctx.state.chatTo = user.chatTo || '';
  ctx.state.playingLocationId = user.playingLocationId || '';
  ctx.state.playingGameId = user.playingGameId || '';
  ctx.state.userId = user.id || '';
  ctx.state.userData_Id = user._id || '';
  ctx.state.user = user || {};
  const [code, text] = ctx?.message?.text ? ctx?.message?.text.split(':') : []
  if (ctx.state.role === 'admin' && myCommands[code]) {
    switch (code) {
      case 'stop':
        await updateUser({id: user.id, data: {
            chatTo: null
          }})
        await ctx.reply('Chatting is stop')
        break
      case 'player':
        const player = await getUserInfo(text.trim())
        if (player.length) {
          await ctx.reply(`
<b>code</b>: <i>${player[0].code}</i>
<b>first_name</b>: <i>${player[0].first_name}</i>
<b>location</b>: <i>${player[0].locationData?.name}</i>
<b>game</b>: <i>${player[0].gameData?.name}</i>
<b>gameLocation</b>: <i>${player[0].playingGameData?.location}</i>
          `, {
            parse_mode: 'html'
          })
          if(player[0].playingGameData?.location) {
            await ctx.replyWithLocation(...player[0].playingGameData?.location.split(', '))
          }
        } else {
          await ctx.reply(`this "${text}" player not found`)
        }
        break
    }
    return false
  }
  return next()
})

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
// bot.command('game', async ctx => GameMenu.replyToContext(ctx))
bot.command('game', async ctx => game({ctx}))
bot.command('admin', async ctx => adminPage(ctx))

bot.on('text', async (ctx) => {
  const [code, text] = ctx.message?.text.split(':')
  const user = code ? await getUserByCode(code) : null;
  if (user && text) {
    await bot.telegram.sendMessage(user.id, `<b><i>${text}</i></b>`, {
      parse_mode: 'html'
    })
  } else if (ctx.state?.chatTo && ctx.message.text) {
    if (ctx.state.role === 'player') {
      await bot.telegram.sendMessage(ctx.state.chatTo, `<b>${ctx.state.user.code}</b>:  <i>${ctx.message.text}</i>`, {
        parse_mode: 'html'
      })
    } else {
      await bot.telegram.sendMessage(ctx.state.chatTo, `<b>${ctx.message.text}</b>`, {
        parse_mode: 'html'
      })
    }
  }
})
bot.action(/^gTo/, async (ctx) => gameTo(ctx)) // gameTo
bot.on('photo', async (ctx) => {
  if (ctx.state?.chatTo) {
    await bot.telegram.sendPhoto(ctx.state.chatTo, ctx.message.photo.pop().file_id)
  }
})
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

const getUserById = async (id) => {
  return Users.findOne({id});
}
const updateUser = async ({id, data}) => {
  return Users.updateOne({id}, data)
}
const getUserByCode = async (code) => {
  return Users.findOne({code});
}
const getUserInfo = async (code) => {
  return Users.aggregate([
    {
      $match: {code}
    },
    {
      $lookup:
        {
          from: "locations",
          localField: "playingLocationId",
          foreignField: "_id",
          as: "location"
        }
    },
    {
      $addFields: {locationData: { $arrayElemAt: [ "$location", 0 ] }}
    },
    {$project: {location: 0}},
    {
      $lookup:
        {
          from: "locationgames",
          localField: "playingGameId",
          foreignField: "_id",
          as: "playingGame"
        }
    },
    {
      $addFields: {playingGameData: { $arrayElemAt: [ "$playingGame", 0 ] }}
    },
    {$project: {playingGame: 0}},
    {
      $lookup:
        {
          from: "games",
          localField: "playingGameData.gameId",
          foreignField: "_id",
          as: "game"
        }
    },
    {
      $addFields: {gameData: { $arrayElemAt: [ "$game", 0 ] }}
    },
    {$project: {game: 0}},
  ])
}
