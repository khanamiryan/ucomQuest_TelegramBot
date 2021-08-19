const LocationGame = require('../location/locationGame.schema')
const Game = require('../game/game.schema')
const Users = require('../user/user.schema')
const Messages = require('../messages/messages.schema')
const {updateUser} = require("../user/user");

const deleteMessagesFunction = async (ctx) => {
  const deleteMessages = await Messages.find({
    userId: ctx.state.userId,
    messagesType: 'delete',
    status: 'active',
  })
  if (deleteMessages.length) {
    for (const deleteMessage of deleteMessages) {
      ctx.deleteMessage(deleteMessage.messageId).then().catch((err) => {
        console.log(2222, err);
      })
    }
    await Messages.updateMany({
      userId: ctx.state.userId,
      messagesType: 'delete'
    }, {
      status: 'deleted'
    })
  }
}

// Game Menu
const game = async ({ctx, text = ''}) => {
  ctx.deleteMessage().catch(err => {
    console.log(err)
  })
  if (ctx.state.playingGameId) {
    ctx.reply('Now you playing a game')
  } else {
    await deleteMessagesFunction(ctx)
    const userGames = await Users.aggregate([
      {$match: {id: ctx.state.userId}},
    ])
    const locationGames = await LocationGame.aggregate([
      {$match: {locationId: ctx.state.playingLocationId}},
      {
        $lookup:
          {
            from: "games",
            localField: "gameId",
            foreignField: "_id",
            as: "gamesInfo"
          }
      },
      {
        $replaceRoot: {newRoot: {$mergeObjects: [{$arrayElemAt: ["$gamesInfo", 0]}, "$$ROOT"]}}
      },
      {$project: {gamesInfo: 0}},
      {
        $match: {
          gameCode: {
            $not: {
              $in: userGames[0].playedGames
            }
          }
        }
      },
    ])
    const gameButtons = [];
    for (const game of locationGames) {
      gameButtons.unshift([
        {text: `${game.name}`, callback_data: `gTo:gId/lG=${game._id}`}, // gId = gameId
      ])
    }
    ctx.reply(`Games`, {reply_markup: JSON.stringify({inline_keyboard: gameButtons})}).then(async (e) => {
      const newMessage = new Messages({
        messageId: e.message_id,
        userId: ctx.state.userId,
        messagesType: 'delete'
      })
      await newMessage.save()
    })
  }
  return false
}
const showGame = async ({ctx, text}) => {
  ctx.deleteMessage().catch(err => {
    console.log(err)
  })
  const [, locationGameText] = text.split('/')
  const [, locationGameId] = locationGameText.split('=')
  const locationGameData = await LocationGame.findById(locationGameId)
  await deleteMessagesFunction(ctx)
  if (locationGameData.location) {
    const deleteMessage = await ctx.replyWithLocation(...locationGameData.location.split(', '))
    const newMessage = new Messages({
      messageId: deleteMessage.message_id,
      userId: ctx.state.userId,
      messagesType: 'delete'
    })
    await newMessage.save()
  }
  const gameData = await Game.findById(locationGameData.gameId)
  const gameButtons = [
    [{ text: `play Game`, callback_data: `gTo:pG/lGId=${locationGameId}`}, // pG = playGame, gTo = gameTo, lGId = locationGameId,
      { text: `🔙 back ↩`, callback_data: `gTo:gM/lGId=${locationGameId}`}] // gM = gameMenu, gTo = gameTo
  ];
  ctx.reply(gameData.description, { reply_markup: JSON.stringify({ inline_keyboard: gameButtons})})
}
const playGame = async ({ctx, text}) => {
  ctx.deleteMessage().catch(err => {
    console.log(err)
  })
  // await deleteMessagesFunction(ctx) todo this deleted game location
  const [,locationGame] = text.split('/')
  const [,locationGameId] = locationGame.split('=')
  const locationGameData = await LocationGame.findById(locationGameId)
  const gameData = await Game.findById(locationGameData.gameId)
  await Users.updateOne({id: ctx.state.userId}, {playingGameId: locationGameData._id, $push: { "playedGames" : gameData.gameCode } })
  ctx.reply(
    `<b>Now you are playing <i>${gameData.name}</i></b>
${gameData.fullDescription}`, {
      parse_mode: 'html'
    })
}
const approveGame = async ({ctx, text}) => {
  ctx.deleteMessage().catch(err => {
    console.log(err)
  })
  const [,user] = text.split('/')
  const [,userId] = user.split('=')
  await updateUser({id: userId, data: {
      playingGameId: undefined
    }})
  const gameButtons = [
    [{ text: `play game`, callback_data: `gTo:gM`}] // gM = gameMenu, gTo = gameTo
  ];
  await ctx.telegram.sendMessage(userId, 'շնորհավորում եմ դուք հաղթահարել եք խաղը', { reply_markup: JSON.stringify({ inline_keyboard: gameButtons})})
}
const rejectGame = async ({ctx, text}) => {
  ctx.deleteMessage().catch(err => {
    console.log(err)
  })
  const [,user] = text.split('/')
  const [,userId] = user.split('=')
  await ctx.telegram.sendMessage(userId, 'Փորձեք կրկին')
}
const gameTo = async (ctx) => {
  const [, text] = ctx.update.callback_query.data.split(':')
  if(text.includes('gId')) { // gId = gameId
    await showGame({ctx, text})
  }
  if(text.includes('gM')) {
    await game({ctx, text})
  }
  if(text.includes('pG')) {
    await playGame({ctx, text})
  }
  if(text.includes('app')) {
    await approveGame({ctx, text})
  }
  if(text.includes('rej')) {
    await rejectGame({ctx, text})
  }

  return false
}
module.exports = {game, gameTo}

// const {MenuTemplate, MenuMiddleware, createBackMainMenuButtons} = require('telegraf-inline-menu')
// const locationGame = require('../location/locationGame.schema')
// let a;
// locationGame.find().then(e => {
//   a = 20
// })
// const game = new MenuTemplate(() => 'Main Menu test')
// for (let i = 1; i < a; i++) {
//   const game = new MenuTemplate('game descriptors full ' + i)
//   game.interact('play game', 'game unic name', {
//     do: ctx => {
//       ctx.deleteMessage()
//       ctx.reply('Now you playing game ' + i)
//       return true
//     }
//   })
//   game.manualRow(createBackMainMenuButtons('back', 'go to Main game'))
//   game.submenu('Game name ' + i, 'gameCode' + i, game, {
//     // hide: () => mainMenuToggle,
//   })
//
// }
//
// const menuMiddleware = new MenuMiddleware('game/', game)
//
// console.log(menuMiddleware.tree())
//
// module.exports = menuMiddleware
