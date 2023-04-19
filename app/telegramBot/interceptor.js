const Users = require("../api/user/user.schema");
const { getUserByTelegramId, updateUserByTelegramId, getUserByVerificationCode, getUserInfo, getUserById} = require("../api/user/user");
const { showGameMenu, checkUserGameStatus, getPlayerGameAndLocationTimes, getPlayerInfoText} = require("./game");
const {getClueById} = require("../api/clue/clue");
const {getLocationDataById} = require("../api/location/location");


const adminCommands = {
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
    const userTelegramId = ctx.from.id;
    let user = await getUserByTelegramId(userTelegramId)

    // verify user by verificationCode

    if (!user) {
      if (ctx.message && ctx.message.text === '/start') {
        return next()
      }
      const userWithSameVerificationCode = await getUserByVerificationCode(ctx.message.text)
      if (userWithSameVerificationCode) {

        if (userWithSameVerificationCode.telegramId) {
          await ctx.reply('Այս կոդը արդեն ակտիվացրած է')
          return false
        }
        // todo: findOneAndUpdate
        await Users.updateOne({ verificationCode: ctx.message.text }, {telegramId: ctx.from.id})
        user = await getUserByTelegramId(userTelegramId)
        if (!user.teamName) {
          await ctx.reply(`Շնորհավորում եմ Ձեզ: Դուք խաղի մեջ եք:\nԱյժմ գրեք Ձեր թիմի անունը, որպեսզի շարունակենք մեր խաղը։`)
          return false
        } else {
            await ctx.reply(`Շնորհավորում եմ Ձեզ: Դուք խաղի մեջ եք:\nԱյժմ կարող եք սկսել խաղը։`)
          await showGameMenu(user.telegramId)
        }
      } else {
        await ctx.reply('Ձեր թիմի կոդը սխալ է, խնդրում ենք ներմուծել ճիշտ կոդը։')
        return false
      }
    }
    // if (user.updatingTeamName && ctx.message && ctx.message.text) {
    //   await updateUserByTelegramId({telegramId: ctx.state.user.telegramId, data: {
    //       updatingTeamName: false
    //     }})
    // }

    ctx.state.role = user.role;
    if(user.role !== 'admin') {
      const userAdmin  = await getUserById(user.adminId);//todo add checking
      ctx.state.chatTo = userAdmin.telegramId;
      ctx.state.playingLocationId = user.playingLocationId || user.playingLocationSteps[0] || undefined;
      ctx.state.playingGameId = user.playingGameId || undefined;
      ctx.state.teamName = user.teamName || '';
    }else {//if admin
      ctx.state.teamName = user.teamName || 'adminTeam';
      ctx.state.chatTo = user.chatTo||"";
    }
    ctx.state.userId = user.telegramId || '';
    ctx.state.userData_Id = user._id || '';

    ctx.state.user = user || {};
    // set team name if not exist
    if (!user.teamName) {
      await Users.updateOne({ telegramId: user.telegramId }, { teamName: ctx.message.text })
      ctx.state.teamName = ctx.message.text
      if (user.role === 'player') {

        const location = await getLocationDataById(user.playingLocationId);
        if(location.needToGoBeforeStart) {
          await ctx.reply(`Սիրելի <b>${ctx.message.text}</b> թիմի անդամներ խնդրում ենք ուղարկել նկար Ձեր թիմից, որպեսզի սկսեք խաղը`, {parse_mode: 'HTML'})
        }
          await showGameMenu(user.telegramId)

      } else {
        await ctx.reply(`Սիրելի <b>${ctx.message.text}</b>, դու <b>ADMIN</b> ես`, {parse_mode: 'HTML'})
      }
      return false
    }
    if(user.role === 'player') {
      ctx.telegram.setMyCommands([
        // {command: '/start', description: 'Start'},
        {command: '/info', description: 'Ինֆորմացիա այս պահի մասին'},
    //    {command: '/points', description: 'Միավորները'},
        {command: '/help', description: 'Օգնություն'},
        {command: '/game', description: 'Խաղերի ցանկը'},
        // {command: '/admin', description: 'Admin'},
        // {command: '/cancel', description: 'Cancel'},
        // {command: '/cancelGame', description: 'Cancel Game'},
        // {command: '/cancelLocation', description: 'Cancel Location'},
        // {command: '/cancelClue', description: 'Cancel Clue'},
        // {command: '/cancelAnswer', description: 'Cancel Answer'},
        // {command: '/cancelQuestion', description: 'Cancel Question'},
        // {command: '/cancelLocationAnswer', description: 'Cancel Location Answer'},
      ]);
    }else if(user.role === 'admin') {
        ctx.telegram.setMyCommands([
            {command: '/start', description: 'Start'},
            {command: '/info', description: 'Ինֆորմացիա այս պահի մասին'},
            // {command: '/points', description: 'Միավորները'},
            {command: '/help', description: 'Օգնություն'},
            {command: '/game', description: 'Խաղը'},
            {command: '/admin', description: 'Admin'},
            // {command: '/cancel', description: 'Cancel'},
            // {command: '/cancelGame', description: 'Cancel Game'},
            // {command: '/cancelLocation', description: 'Cancel Location'},
            // {command: '/cancelClue', description: 'Cancel Clue'},
            // {command: '/cancelAnswer', description: 'Cancel Answer'},
            // {command: '/cancelQuestion', description: 'Cancel Question'},
            // {command: '/cancelLocationAnswer', description: 'Cancel Location Answer'},
        ]);
    }

    const [getCode, text, command] = ctx.message && ctx.message.text ? ctx.message.text.split(':') : []
    const code = getCode && getCode.trim().toLocaleLowerCase();
    if (code && ctx.state.role === 'admin' && adminCommands[code]) {
      const [player] = await getUserInfo((text || '').trim())
      if(code==="stop"){//stop chatting with current player
        await stopChatting({user, ctx})
      }else
      if (player && player.telegramId) {
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
          // case 'stop':
          //   await stopChatting({user, ctx})
          //   break
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
  await Users.updateOne({telegramId: player.telegramId}, { $unset: { telegramId: ""} });
  await ctx.telegram.sendMessage(player.telegramId, `Դուք հեռացված եք խաղից`, {parse_mode: 'HTML'})
  await ctx.reply(`${player.teamName} info was removed`, {parse_mode: 'HTML'})
}
const cancelGame = async ({player, ctx}) => {
  await updateUserByTelegramId({
    telegramId: player.telegramId,
    data: {
      playingGameId: undefined,
      $unset: {playingGameTime: ""},
    }
  })
  await ctx.reply(
    `<b>Game canceled</b>
<b>Team Name</b>: <i>${player.teamName}</i>`, {parse_mode: 'HTML'})
  await ctx.telegram.sendMessage(player.telegramId, `Ձեր Խաղը չեղարկվել է`, {parse_mode: 'HTML'})
  await showGameMenu(player.telegramId)
  await playerInfoForAdmin({player, ctx})
}
const stopChatting = async ({user, ctx}) => {
  if(!user.chatTo){//admin have chatto
    await ctx.reply('You are not chatting with anyone');
    return;
  }
  await updateUserByTelegramId({
    telegramId: user.telegramId,
    data: {
      chatTo: null
    }
  });
  await ctx.reply('Chatting is stop')
}
const updateName = async ({player, ctx, command}) => {
  await updateUserByTelegramId({
    telegramId: player.telegramId,
    data: {
      teamName: command,
    }
  })
  await ctx.reply(
    `<b>Team name is edited</b>
<i>${command}</i>`, {parse_mode: 'HTML'})
  await ctx.telegram.sendMessage(player.telegramId, `Ձեր թիմի անունն է՝ <b>${command}</b>`, {parse_mode: 'HTML'})
}
const addPoint = async ({player, command, ctx}) => {
  await updateUserByTelegramId({
    telegramId: player.telegramId,
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
    await ctx.telegram.sendMessage(player.telegramId, `Ձեր թիմին ավելացվեց <b>${command}</b> միավոր`, {parse_mode: 'HTML'})
  } else {
    await ctx.telegram.sendMessage(player.telegramId, `Ձեր թիմից պակասեցվեց <b>${command}</b> միավոր`, {parse_mode: 'HTML'})
  }
  await playerInfoForAdmin({player, ctx})
  await checkUserGameStatus(player.telegramId)
}

const addLocationPoint = async ({player, command, ctx}) => {
  await updateUserByTelegramId({
    telegramId: player.telegramId,
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
    await ctx.telegram.sendMessage(player.telegramId, `Ձեր թիմին ավելացվեց <b>${command}</b> միավոր`, {parse_mode: 'HTML'})
  } else {
    await ctx.telegram.sendMessage(player.telegramId, `Ձեր թիմից պակասեցվեց <b>${command}</b> միավոր`, {parse_mode: 'HTML'})
  }
  await playerInfoForAdmin({player, ctx})
  await checkUserGameStatus(player.telegramId)
}

const playerInfoForAdmin = async ({player, ctx}) => {
  if (player && player._id) {
    const user = await getUserByTelegramId(player.telegramId)
    const userInfoText = await getPlayerInfoText(user);
    await ctx.reply(userInfoText, {
      parse_mode: 'html'
    })
    //todo: playingGameData?????
    if (user.playingGameData && user.playingGameData.locationFromGoogle) {
      await ctx.replyWithLocation(...user.playingGameData.locationFromGoogle.split(', '))
    }
  } else {
    await ctx.reply(`this "<b>${text.trim()}</b>" player not found`, {parse_mode: 'HTML'})
  }
}

module.exports = interceptor
