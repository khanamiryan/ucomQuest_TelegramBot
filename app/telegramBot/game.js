const Game = require('../api/game/game.schema')
const Users = require('../api/user/user.schema')
const Messages = require('../api/messages/messages.schema')
const {updateUser, getUserById} = require("../api/user/user");
const {Telegraf} = require('telegraf');
const {getLocationDataById} = require("../api/location/location");
const {getGameById, updateGame} = require("../api/game/game");
const {newMessage} = require("../api/messages/messages");
const moment = require('moment');
const bot = new Telegraf(process.env.botToken, {
  polling: true,
});
const deleteMessagesFunction = async (userId) => {
  const deleteMessages = await Messages.find({
    userId,
    messagesType: 'delete',
    status: 'active',
  })
  if (deleteMessages.length) {
    for (const deleteMessage of deleteMessages) {
      bot.telegram.deleteMessage(userId, deleteMessage.messageId).then().catch((err) => {
        console.log(2222, err);
      })
    }
    await Messages.updateMany({
      userId,
      messagesType: 'delete'
    }, {
      status: 'deleted'
    })
  }
}

const showGame = async ({ctx, text}) => {
  const [, locationGameText] = text.split('/')
  const [, locationGameId] = locationGameText.split('=')
  const gameData = await Game.findById(locationGameId)
  await deleteMessagesFunction(ctx.state.userId)
  if (gameData.location) {
    const deleteMessage = await ctx.replyWithLocation(...gameData.location.split(', '))
    await newMessage({
      messageId: deleteMessage.message_id,
      userId: ctx.state.userId,
    })
  }
  const gameButtons = [
    [{ text: `play Game`, callback_data: `gTo:pG/lGId=${locationGameId}`}, // pG = playGame, gTo = gameTo, lGId = locationGameId,
      { text: `🔙 back ↩`, callback_data: `gTo:gM/lGId=${locationGameId}`}] // gM = gameMenu, gTo = gameTo
  ];
  await ctx.reply(`<b>${gameData.name}</b>: <i>${gameData.point}</i>`, {
    parse_mode: 'HTML'
  }).then(async (e) => {
    await newMessage({
      messageId: e.message_id,
      userId: ctx.state.userId,
    })
  })
  await ctx.reply(gameData.description, { reply_markup: JSON.stringify({ inline_keyboard: gameButtons})}).then(async (e) => {
    await newMessage({
      messageId: e.message_id,
      userId: ctx.state.userId,
    })
  })
}
const playGame = async ({ctx, text}) => {
  ctx.deleteMessage().catch(err => {
    console.log(err)
  })
  const [,locationGame] = text.split('/')
  const [,locationGameId] = locationGame.split('=')
  const gameData = await Game.findById(locationGameId)
  await updateGame(
    {_id: gameData._id},
    {
      $inc: {
        nowPlaying: +1
      }
    })
  await Users.updateOne({id: ctx.state.userId}, {
    playingGameId: gameData._id,
    $push: { "playedGames" : gameData.gameCode },
    playingGameTime: moment().add(gameData.gamePlayTime, 'minutes')
  })
  ctx.reply(
    `<b>Now you are playing <i>${gameData.name}</i></b>
${gameData.fullDescription}`, {
      parse_mode: 'html'
    })
}

// Game Menu
const showGameMenu = async (userId) => {
  const user = await getUserById(userId)
  await deleteMessagesFunction(userId)
  if (user.role === 'admin') {
    await bot.telegram.sendMessage(userId, 'you are Admin')
    return false
  }
  if (user.playStatus === 'finishGames') {
    await bot.telegram.sendMessage(userId, 'you are finishGames')
  } else if(user.playStatus === 'goingLocation') {
    const location = await getLocationDataById(user.playingLocationId)
    await bot.telegram.sendMessage(userId, location.startDescription)
  } else if (user.playingGameId) {
    await bot.telegram.sendMessage(userId, 'Now you playing a game')
  } else {
    const userGames = await Users.aggregate([
      {$match: {id: userId}},
    ])
    const locationData = await getLocationDataById(user.playingLocationId)
    const gameType =  user.locationPoint < locationData.finishPoint ? 'standardGame' : 'levelUp'
    const games = await Game.aggregate([
      {$match: {locationId: user.playingLocationId}},
      {
        $match: {
          gameCode: {
            $not: {
              $in: userGames[0].playedGames
            }
          }
        }
      },
      {
        $match: {
          gameType,
        }
      },
      {
        $match:
          {
            $expr: {$gt: ["$maxPlayerCount", "$nowPlaying"]}
          }
      }
    ])
    const gameButtons = [];
    for (const game of games) {
      gameButtons.unshift([
        {text: `${game.name}: ${game.point}`, callback_data: `gTo:gId/lG=${game._id}`}, // gId = gameId
      ])
    }
    if (gameType === 'levelUp') {
      await updateUser({
        id: userId,
        data: {
          playStatus: 'playingLevelUp',
        }
      })
      await bot.telegram.sendMessage(userId, `You are levelUp`).then(async (e) => {
        await newMessage({
          messageId: e.message_id,
          userId,
        })
      });
    }
    await bot.telegram.sendMessage(userId, `Games`, {reply_markup: JSON.stringify({inline_keyboard: gameButtons})}).then(async (e) => {
      await newMessage({
        messageId: e.message_id,
        userId,
      })
    })
  }
}
const approveGame = async ({ctx, text}) => {
  ctx.deleteMessage().catch(err => {
    console.log(err)
  })
  const [,user] = text.split('/')
  const [,userId] = user.split('=')
  const userData = await getUserById(userId)
  if (userData.playStatus === 'playingGame') {
    const game = await getGameById(userData.playingGameId)
    await updateGame(
      {_id: userData.playingGameId},
      {
        $inc: {
          nowPlaying: -1
        }
      })
    await updateUser({id: userId, data: {
        playingGameId: undefined,
        $unset: { playingGameTime: ""},
        $inc: {
          locationPoint: +game.point
        },
      }})
    await ctx.telegram.sendMessage(userId, 'շնորհավորում եմ դուք հաղթահարել եք խաղը')
  } else if (userData.playStatus === 'playingLevelUp') {
    const playingLocationStep = userData.playingLocationSteps.indexOf(userData.playingLocationId)
    if (playingLocationStep < userData.playingLocationSteps.length - 1) { // if playing in last location
      await updateUser({
        id: userData.id,
        data: {
          playingLocationId: userData.playingLocationSteps[playingLocationStep + 1],
          $inc: {
            allPoint: +userData.locationPoint
          },
          locationPoint: 0,
          playStatus: 'goingLocation',
          playingGameId: undefined,
          $unset: { playingLocationTime: ""},
        }
      })
      await ctx.telegram.sendMessage(userId, 'You are finishGames')
    } else {
      await updateUser({
        id: userData.id,
        data: {
          $inc: {
            allPoint: +userData.locationPoint
          },
          locationPoint: 0,
          playStatus: 'finishGames',
          playingGameId: undefined,
        }
      })
    }
  }
  await showGameMenu(userId)
}
const rejectGame = async ({ctx, text}) => {
  await reject({ctx, text})
}
const approveLocation = async ({ctx, text}) => {
  ctx.deleteMessage().catch(err => {
    console.log(err)
  })
  const [,user] = text.split('/')
  const [,userId] = user.split('=')
  const userData = await getUserById(userId)
  const locationData = await getLocationDataById(userData.playingLocationId)
  console.log('locationData.finishTime', locationData);
  await updateUser({id: userId, data: {
      playStatus: 'playingGame',
      playingLocationTime: moment().add(locationData.finishTime, 'minutes')
    }})
  await ctx.telegram.sendMessage(userId, 'դուք հասաք նշված վայր')
  await showGameMenu(userId)
}
const rejectLocation = async ({ctx, text}) => {
  await reject({ctx, text})
}
const reject = async ({ctx, text}) => {
  ctx.deleteMessage().catch(err => {
    console.log(err)
  })
  const [,user] = text.split('/')
  const [,userId] = user.split('=')
  await ctx.telegram.sendMessage(userId, 'Փորձեք կրկին')
}

const showPoints = async (ctx) => {
  const {user} = await ctx.state
  await ctx.reply(
    `<b>${user.teamName}</b>
<b>Location Point</b>: <i>${user.locationPoint}</i>
<b>All Point</b>: <i>${user.allPoint}</i>
`,
    {
      parse_mode: 'HTML'
    }
  )
}

const gameTo = async (ctx) => {
  const [, text] = ctx.update.callback_query.data.split(':')
  const [command] = text.split('/')
  switch (command) {
    case 'gId': await showGame({ctx, text})
      break;
    case 'gM': await showGameMenu(ctx.state.userId)
      break;
    case 'pG': await playGame({ctx, text})
      break;
    case 'appG': await approveGame({ctx, text})
      break;
    case 'rejG': await rejectGame({ctx, text})
      break;
    case 'appL': await approveLocation({ctx, text})
      break;
    case 'rejL': await rejectLocation({ctx, text})
      break;
  }
  return false
}
module.exports = {
  showGameMenu,
  gameTo,
  showPoints
}
