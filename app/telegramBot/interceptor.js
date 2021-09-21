const Users = require("../api/user/user.schema");
const { getUserById, updateUser, getUserByVerificationCode, getUserInfo } = require("../api/user/user");
const { showGameMenu, checkUserGameStatus, getPlayerGameAndLocationTimes} = require("./game");

const myCommands = {
  stop: 'chatting is stop',
  player: 'playerInfo',
  point: 'added point to player',
  locationpoint: 'add Location Point',
  cancelgame: 'player Games is canceled',
  name: 'team new Name',
  removeplayerinfo: 'remove Player Info, for change user'
}


const interceptor = async(ctx, next) => {
  try {
    let user = await getUserById(ctx.from.id)
    // verify user by verificationCode
    if (!user) {
      if (ctx.message && ctx.message.text === '/start') {
        return next()
      }
      const verificationCode = await getUserByVerificationCode(ctx.message.text)
      if (verificationCode) {
        if (verificationCode.id) {
          await ctx.reply('Այս կոդը վավեր չէ')
          return false
        }
        await Users.updateOne({ verificationCode: ctx.message.text }, ctx.from)
        user = await getUserById(ctx.from.id)
        if (!user.teamName) {
          await ctx.reply(`Շնորհավորում եմ Ձեզ: Դուք խաղի մեջ եք:\nԱյժմ գրեք Ձեր թիմի անունը, որպեսզի շարունակենք մեր խաղը։`)
          return false
        } else {
          await showGameMenu(user.id)
        }
      } else {
        await ctx.reply('Ձեր թիմի կոդը սխալ է, խնդրում ենք ներմուծել ճիշտ կոդը։')
        return false
      }
    }
    // if (user.updatingTeamName && ctx.message && ctx.message.text) {
    //   await updateUser({id: ctx.state.user.id, data: {
    //       updatingTeamName: false
    //     }})
    // }
    ctx.state.role = user.role;
    ctx.state.chatTo = user.chatTo || '';
    ctx.state.playingLocationId = user.playingLocationId || '';
    ctx.state.playingGameId = user.playingGameId || undefined;
    ctx.state.userId = user.id || '';
    ctx.state.userData_Id = user._id || '';
    ctx.state.teamName = user.teamName || '';
    ctx.state.user = user || {};
    // set team name if not exist
    if (!user.teamName) {
      await Users.updateOne({ id: user.id }, { teamName: ctx.message.text })
      ctx.state.teamName = ctx.message.text
      if (user.role === 'player') {
        await ctx.reply(`Սիրելի <b>${ctx.message.text}</b> թիմի անդամներ գտեք մեքենան, որի վրա գրված է Ձեր թիմի կոդը և ուղևորվեք ...`, {parse_mode: 'HTML'})
        await showGameMenu(user.id)
      } else {
        await ctx.reply(`Սիրելի <b>${ctx.message.text}</b>, դու <b>ADMIN</b> եք`, {parse_mode: 'HTML'})
      }
      return false
    }

    const [getCode, text, command] = ctx.message && ctx.message.text ? ctx.message.text.split(':') : []
    const code = getCode.trim().toLocaleLowerCase();
    if (code && ctx.state.role === 'admin' && myCommands[code]) {
      const [player] = await getUserInfo((text || '').trim())
      if (player && player.id) {
        switch (code) {
          case 'cancelgame':
            await cancelGame({player, ctx})
            break
          case 'point':
            await addPoint({player, ctx, command})
            break
          case 'locationpoint':
            await addLocationPoint({player, ctx, command})
            break
          case 'removeplayerinfo':
            await removePlayerInfo({player, ctx})
            break;
          case 'name':
            await updateName({player, ctx, command})
            break
          case 'stop':
            await stopChatting({user, ctx})
            break
          case 'player':
            await playerInfoForAdmin({player, ctx})
            break
        }
      } else {
        ctx.reply('user not found')
      }
      return false
    }
    return next()
  } catch (e) {
    console.log(e);
  }
}
const removePlayerInfo = async ({player, ctx}) => {
  await Users.updateOne({id: player.id}, { $unset: { id: ""} });
  await ctx.telegram.sendMessage(player.id, `Դուք հեռացված եք խաղից`, {parse_mode: 'HTML'})
  await ctx.reply(`${player.teamName} info was removed`, {parse_mode: 'HTML'})
}
const cancelGame = async ({player, ctx}) => {
  await updateUser({
    id: player.id,
    data: {
      playingGameId: undefined,
      $unset: {playingGameTime: ""},
    }
  })
  await ctx.reply(
    `<b>Game canceled</b>
<b>Team Name</b>: <i>${player.teamName}</i>`, {parse_mode: 'HTML'})
  await ctx.telegram.sendMessage(player.id, `Ձեր Խաղը չեղարկվել է`, {parse_mode: 'HTML'})
  await showGameMenu(player.id)
  await playerInfoForAdmin({player, ctx})
}
const stopChatting = async ({user, ctx}) => {
  await updateUser({
    id: user.id,
    data: {
      chatTo: null
    }
  })
  await ctx.reply('Chatting is stop')
}
const updateName = async ({player, ctx, command}) => {
  await updateUser({
    id: player.id,
    data: {
      teamName: command,
    }
  })
  await ctx.reply(
    `<b>Team name is edited</b>
<i>${command}</i>`, {parse_mode: 'HTML'})
  await ctx.telegram.sendMessage(player.id, `Ձեր թիմի անունն է՝ <b>${command}</b>`, {parse_mode: 'HTML'})
}
const addPoint = async ({player, command, ctx}) => {
  await updateUser({
    id: player.id,
    data: {
      $inc: {
        allPoint: command
      },
    }
  })
  await ctx.reply(
    `<b>Point added</b>
<b>Team Name</b>: <i>${player.teamName}</i>
<b>Point</b>: <i>${command}</i>`, {parse_mode: 'HTML'})
  if (command > 0) {
    await ctx.telegram.sendMessage(player.id, `Ձեր թիմին ավելացվեց <b>${command}</b> միավոր`, {parse_mode: 'HTML'})
  } else {
    await ctx.telegram.sendMessage(player.id, `Ձեր թիմից պակասեցվեց <b>${command}</b> միավոր`, {parse_mode: 'HTML'})
  }
  await playerInfoForAdmin({player, ctx})
  await checkUserGameStatus(player.id)
}

const addLocationPoint = async ({player, command, ctx}) => {
  await updateUser({
    id: player.id,
    data: {
      $inc: {
        locationPoint: command
      },
    }
  })
  await ctx.reply(
    `<b>Location Point added</b>
<b>Team Name</b>: <i>${player.teamName}</i>
<b>Point</b>: <i>${command}</i>`, {parse_mode: 'HTML'})
  if (command > 0) {
    await ctx.telegram.sendMessage(player.id, `Ձեր թիմին ավելացվեց <b>${command}</b> միավոր`, {parse_mode: 'HTML'})
  } else {
    await ctx.telegram.sendMessage(player.id, `Ձեր թիմից պակասեցվեց <b>${command}</b> միավոր`, {parse_mode: 'HTML'})
  }
  await playerInfoForAdmin({player, ctx})
  await checkUserGameStatus(player.id)
}

const playerInfoForAdmin = async ({player, ctx}) => {
  if (player && player._id) {
    const user = await getUserById(player.id)
    const userTimes = await getPlayerGameAndLocationTimes(player.id)
    await ctx.reply(`
<b>code</b>: <i>${user.code}</i>
<b>Team Name</b>: <i>${user.teamName}</i>
<b>Team location ponit</b>: <i>${user.locationPoint}</i>
<b>Team all ponit</b>: <i>${user.allPoint + user.locationPoint}</i>
<b>location</b>: <i>${user.locationData && user.locationData.name || "doesn't exist"}</i>
<b>locationTime</b>: <i>${userTimes.locationTime}</i>
<b>game</b>: <i>${user.gameData && user.gameData.name || "doesn't exist"}</i>
<b>gameTime</b>: <i>${userTimes.gameTime}</i>
<b>gameLocation</b>: <i>${user.playingGameData && user.playingGameData.location || "doesn't exist"}</i>
          `, {
      parse_mode: 'html'
    })
    if (user.playingGameData && user.playingGameData.location) {
      await ctx.replyWithLocation(...user.playingGameData.location.split(', '))
    }
  } else {
    await ctx.reply(`this "<b>${text.trim()}</b>" player not found`, {parse_mode: 'HTML'})
  }
}

module.exports = interceptor
