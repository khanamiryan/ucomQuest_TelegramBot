const {getUserByCode, updateUser} = require("../api/user/user");
const {getLocationDataById} = require("../api/location/location");
const {saveFile} = require("../api/file/file");
const {getGameById} = require("../api/game/game");
const onText = async (ctx) => {
  const [code, text] = ctx.message?.text.split(':')
  const user = code ? await getUserByCode(code) : null;
  if (user && text) {
    await ctx.telegram.sendMessage(user.id, `<b><i>${text}</i></b>`, {
      parse_mode: 'html'
    })
  } else if (ctx.state?.chatTo && ctx.message.text) {
    if (ctx.state.role === 'player') {
      await ctx.telegram.sendMessage(ctx.state.chatTo, `<b>${ctx.state.user.code}</b>:  <i>${ctx.message.text}</i>`, {
        parse_mode: 'html'
      })
    } else {
      await ctx.telegram.sendMessage(ctx.state.chatTo, `<b>${ctx.message.text}</b>`, {
        parse_mode: 'html'
      })
    }
  }
}
const onPhoto = async (ctx) => {
  const photo = await ctx.telegram.getFileLink(ctx.message.photo.pop().file_id)
  const game = await getGameById(ctx.state.playingGameId)
  await saveFile({
    fileId: ctx.message.photo.pop().file_id,
    userId: ctx.state.user.id,
    userTeamName: ctx.state.user.teamName,
    userCode: ctx.state.user.code,
    fileHref: photo.href,
    fileType: 'photo',
    gameName: game?.name,
    gameLocation: game?.location,
  })
  if (ctx.state?.chatTo && ctx.state?.role === 'player') {
    await ctx.telegram.sendMessage(ctx.state.chatTo, `
<b>plyerCode</b>: <b>${ctx.state.user.code}</b>
<b>playerTeamName</b>: ${ctx.state.user.teamName}
<i>send you a photo</i>`, {
      parse_mode: 'html'
    })
    await ctx.telegram.sendPhoto(ctx.state.chatTo, ctx.message.photo.pop().file_id)
    if (game?._id) {
      const gameButtons = [
        [{ text: `✅ approve`, callback_data: `gTo:appG/uId=${ctx.state.userId}`}, // appG = approve Game, uId = userId,
          { text: `❌ reject`, callback_data: `gTo:rejG/uId=${ctx.state.userId}`}] // rejG = reject Game, uId = userId,
      ];
      await ctx.telegram.sendMessage(ctx.state.chatTo, `GameName: ${game.name}`, {reply_markup: JSON.stringify({inline_keyboard: gameButtons})})
    } else if (ctx.state.user.playStatus === 'goingLocation') {
      const userLocation = await getLocationDataById(ctx.state.user.playingLocationId);
      const gameButtons = [
        [{ text: `✅ approve`, callback_data: `gTo:appL/uId=${ctx.state.userId}`}, // appL = approve Location, uId = userId,
          { text: `❌ reject`, callback_data: `gTo:rejL/uId=${ctx.state.userId}`}] // rejL = reject Location, uId = userId,
      ];
      await ctx.telegram.sendMessage(ctx.state.chatTo, `Going To: ${userLocation.name}`, {reply_markup: JSON.stringify({inline_keyboard: gameButtons})})

    }
  } else {
    await ctx.telegram.sendPhoto(ctx.state.chatTo, ctx.message.photo.pop().file_id)
  }
}
const onVideo = async (ctx) => {
  const video = await ctx.telegram.getFileLink(ctx.message.video.file_id)
  const game = await getGameById(ctx.state.playingGameId)
  await saveFile({
    fileId: ctx.message.video.file_id,
    userId: ctx.state.user.id,
    userTeamName: ctx.state.user.teamName,
    userCode: ctx.state.user.code,
    fileHref: video.href,
    fileType: 'video',
    gameName: game.name,
    gameLocation: game.location,
  })
  if (ctx.state?.chatTo && ctx.state?.role === 'player') {
    await ctx.telegram.sendMessage(ctx.state.chatTo, `
<b>plyerCode</b>: <b>${ctx.state.user.code}</b>
<b>playerTeamName</b>: ${ctx.state.user.teamName}
<i>send you a Video</i>`, {
      parse_mode: 'html'
    })
    await ctx.telegram.sendVideo(ctx.state.chatTo, ctx.message.video.file_id)
    if (game.length) {
      const gameButtons = [
        [{ text: `✅ approve`, callback_data: `gTo:appG/uId=${ctx.state.userId}`}, // app = approve, gTo = gameTo, uId = userId,
          { text: `❌ reject`, callback_data: `gTo:rejG/uId=${ctx.state.userId}`}] // rej = reject, gTo = gameTo, uId = userId,
      ];
      await ctx.telegram.sendMessage(ctx.state.chatTo, `GameName: ${game.name}`, {reply_markup: JSON.stringify({inline_keyboard: gameButtons})})
    }
  } else {
    await ctx.telegram.sendVideo(ctx.state.chatTo, ctx.message.video.file_id)
  }
}
const actionTextTo = async (ctx) => {
  const [,userId, userCode] = ctx.update.callback_query.data.split(':')
  await updateUser({
    id: ctx.from.id,
    data: {
      chatTo: userId
    }
  })
  ctx.editMessageText(`now we chatting with ${userCode}`)
}
const onContact = async (ctx) => {
  await updateUser({
    id: ctx.update.message.contact.user_id,
    data: {
      phone_number: +ctx.update.message.contact.phone_number,
    }
  })
  ctx.reply(`thank you our admins will contact you, by that number\n${ctx.update.message.contact.phone_number}`)
}
const onLocation = async (ctx) => {
  console.log(123, ctx);
  // await updateUser({
  //   id: ctx.update.message.contact.user_id,
  //   data: {
  //     phone_number: +ctx.update.message.contact.phone_number,
  //   }
  // })
  ctx.reply(`thank you`)
}
module.exports = {
  onLocation,
  onContact,
  actionTextTo,
  onText,
  onPhoto,
  onVideo
}
