const Users = require("../user/user.schema");
const {getUserInfo, getUserById, getUserByCode, updateUser} = require("../user/user");

const myCommands = {
  stop: 'chatting is stop',
  player: 'playerInfo'
}


const interceptor = async (ctx, next) => {

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
}

module.exports = interceptor
