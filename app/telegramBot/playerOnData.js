const {getUserByCode} = require("../user/user");
const {getLocationGameData} = require("../location/location");
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
  if (ctx.state?.chatTo) {
    await ctx.telegram.sendMessage(ctx.state.chatTo, `<b>${ctx.state.user.code} send a photo</b>`, {
      parse_mode: 'html'
    })
    await ctx.telegram.sendPhoto(ctx.state.chatTo, ctx.message.photo.pop().file_id)
    const game = await getLocationGameData(ctx.state.playingGameId)
    if (game.length) {
      const gameButtons = [
        [{ text: `✅ approve`, callback_data: `gTo:app/uId=${ctx.state.userId}`}, // app = approve, gTo = gameTo, uId = userId,
          { text: `❌ reject`, callback_data: `gTo:rej/uId=${ctx.state.userId}`}] // rej = reject, gTo = gameTo, uId = userId,
      ];
      await ctx.telegram.sendMessage(ctx.state.chatTo, `GameName: ${game[0].gameData.name}`, {reply_markup: JSON.stringify({inline_keyboard: gameButtons})})
    }
  }
}
module.exports = {
  onText,
  onPhoto
}
