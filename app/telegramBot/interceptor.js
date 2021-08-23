const Users = require("../api/user/user.schema");
const {getUserById, updateUser, getUserByVerificationCode, getUserInfo} = require("../api/user/user");
const {showGameMenu} = require("./game");

const myCommands = {
  stop: 'chatting is stop',
  player: 'playerInfo',
  point: 'added point to player',
  cancelGame: 'player Games is canceled'
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
  ctx.state.playingGameId = user.playingGameId || undefined;
  ctx.state.userId = user.id || '';
  ctx.state.userData_Id = user._id || '';
  ctx.state.teamName = user.teamName || '';
  ctx.state.user = user || {};

  // set team name if not exist
  if (!user.teamName) {
    await Users.updateOne({id: user.id}, {teamName: ctx.message.text})
    await ctx.reply(`Your team Name is <b>${ctx.message.text}</b>`, {parse_mode: 'HTML'})
    ctx.state.teamName = ctx.message.text
    user.role === 'player' && await showGameMenu(user.id)
    return false
  }

  const [code, text, point] = ctx?.message?.text ? ctx?.message?.text.split(':') : []
  if (code && ctx.state.role === 'admin' && myCommands[code.trim()]) {
    const [player] = await getUserInfo(text.trim())
    switch (code.trim()) {
      case 'cancelGame':
        await updateUser({id: player.id, data: {
            playingGameId: undefined,
            $unset: { playingGameTime: ""},
          }})
        await ctx.reply(
          `<b>Game canceled</b>
<b>Team Name</b>: <i>${player.teamName}</i>`
          , {parse_mode: 'HTML'})
        await showGameMenu(player.id)
        break
      case 'point':
        await updateUser({id: player.id, data: {
            $inc: {
              locationPoint: point
            },
          }})
        await ctx.reply(
          `<b>Point added</b>
<b>Team Name</b>: <i>${player.teamName}</i>
<b>Point</b>: <i>${point}</i>`
          , {parse_mode: 'HTML'})
        await showGameMenu(player.id)
        break
      case 'stop':
        await updateUser({id: user.id, data: {
            chatTo: null
          }})
        await ctx.reply('Chatting is stop')
        break
      case 'player':
        if (player?._id) {
          await ctx.reply(`
<b>code</b>: <i>${player.code}</i>
<b>Team Name</b>: <i>${player.teamName}</i>
<b>Team location ponit</b>: <i>${player.locationPoint}</i>
<b>Team all ponit</b>: <i>${player.allPoint}</i>
<b>location</b>: <i>${player.locationData?.name || "doesn't exist"}</i>
<b>game</b>: <i>${player.gameData?.name || "doesn't exist"}</i>
<b>gameLocation</b>: <i>${player.playingGameData?.location || "doesn't exist"}</i>
          `, {
            parse_mode: 'html'
          })
          if(player.playingGameData?.location) {
            await ctx.replyWithLocation(...player.playingGameData?.location.split(', '))
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
