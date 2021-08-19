const Users = require("../user/user.schema");
const {getUserInfo, getUserById, updateUser, getUserByVerificationCode} = require("../user/user");
const {showGameMenu} = require("./game");

const myCommands = {
  stop: 'chatting is stop',
  player: 'playerInfo'
}


const interceptor = async (ctx, next) => {

  let user = await getUserById(ctx.from.id)
  // verify user by verificationCode
  if(!user) {
    const verificationCode = await getUserByVerificationCode(ctx.message.text)
    if (verificationCode) {
      if (verificationCode.id) {
        return false
      }
      await Users.updateOne({verificationCode: ctx.message.text}, ctx.from)
      await ctx.reply(`you are connected\nplease insert your Team Name`)
      return false
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
  ctx.state.teamName = user.teamName || '';
  ctx.state.user = user || {};

  // set team name if not exist
  if (!user.teamName) {
    await Users.updateOne({id: user.id}, {teamName: ctx.message.text})
    ctx.reply(`Your team Name is <b>${ctx.message.text}</b>`, {parse_mode: 'HTML'})
    await showGameMenu(user.id)
    return false
  }

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
<b>Team Name</b>: <i>${player[0].teamName}</i>
<b>location</b>: <i>${player[0].locationData?.name || "doesn't exist"}</i>
<b>game</b>: <i>${player[0].gameData?.name || "doesn't exist"}</i>
<b>gameLocation</b>: <i>${player[0].playingGameData?.location || "doesn't exist"}</i>
          `, {
            parse_mode: 'html'
          })
          if(player[0].playingGameData?.location) {
            await ctx.replyWithLocation(...player[0].playingGameData?.location.split(', '))
          }
        } else {
          await ctx.reply(`this "<b>${text.trim()}</b>" player not found`, {parse_mode: 'HTML'})
        }
        break
    }
    return false
  }
  return next()
}

module.exports = interceptor
