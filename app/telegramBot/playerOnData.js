const {getUserByCode} = require("../user/user");
const onText = async (ctx, bot) => {
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
}
const onPhoto = async (ctx, bot) => {
  if (ctx.state?.chatTo) {
    await bot.telegram.sendMessage(ctx.state.chatTo, `<b>${ctx.state.user.code} send a photo</b>`, {
      parse_mode: 'html'
    })
    await bot.telegram.sendPhoto(ctx.state.chatTo, ctx.message.photo.pop().file_id)
  }
}
module.exports = {
  onText,
  onPhoto
}
