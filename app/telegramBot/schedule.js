const {userAggregate, getUserInfo, getUserById, updateUser} = require("../api/user/user");
const moment = require("moment");
const {getLocationDataById} = require("../api/location/location");
const scheduleFunction = async (bot) => {
  const playersGameTime = await userAggregate([
    {
      $match: {
        role: 'player'
      }
    },
    {
      $match: {
        playingGameTime: { $exists: true }
      }
    },
    {
      $match: {
        playingGameTime: {
          $lte: new Date(moment().add(+process.env.notificationTimeInMinutes + 1, 'minutes')),
          $gte: new Date(moment().add(+process.env.notificationTimeInMinutes, 'minutes')),
        }
      }
    }
  ])
  const playersLocationTime = await userAggregate([
    {
      $match: {
        role: 'player'
      }
    },
    {
      $match: {
        playingLocationTime: { $exists: true }
      }
    },
    {
      $match: {
        playingLocationTime: {
          $lte: new Date(moment().add(+process.env.notificationTimeInMinutes + 1, 'minutes')),
          $gte: new Date(moment().add(+process.env.notificationTimeInMinutes, 'minutes')),
        }
      }
    }
  ])
  if (playersLocationTime.length) {
    for(const playersLocation of playersLocationTime) {
      // console.log(123, moment().diff(playersLocation.playingLocationTime, 'minutes'));
      const locationData = await getLocationDataById(playersLocation.playingLocationId)
      const [player] = await getUserInfo(playersLocation.code)
      await bot.telegram.sendMessage(player.chatTo,
        `<b>Location</b>
Time will end in ${+process.env.notificationTimeInMinutes} minutes
<b>Location Name</b>: <i>${locationData.name}</i>
<b>code</b>: <i>${user.code}</i>
<b>Team Name</b>: <i>${user.teamName}</i>
<b>Team location ponit</b>: <i>${user.locationPoint}</i>
<b>Team all ponit</b>: <i>${user.allPoint + user.locationPoint}</i>
<b>location</b>: <i>${user.locationData && user.locationData.name || "doesn't exist"}</i>
<b>locationTime</b>: <i>${userTimes.locationTime}</i>
<b>game</b>: <i>${user.gameData && user.gameData.name || "doesn't exist"}</i>
<b>gameTime</b>: <i>${userTimes.gameTime}</i>
<b>gameLocation</b>: <i>${user.playingGameData && user.playingGameData.location || "doesn't exist"}</i>
`,
        {parse_mode: 'HTML'})
    }
  }
  if (playersGameTime.length) {
    for(const playersGame of playersGameTime) {
      const player = await getUserById(playersGame.id)
      const locationData = await getLocationDataById(player.playingLocationId)
      await bot.telegram.sendMessage(player.id, `Խաղը ավարտելու համար ձեզ մնացել է <b>${process.env.notificationTimeInMinutes}</b> րոպե`, {
        parse_mode: 'html'
      })
      await bot.telegram.sendMessage(player.chatTo,
        `<B>Game</B>
Time will end in ${process.env.notificationTimeInMinutes} minutes
<b>Location Name</b>: <i>${locationData.name}</i>
<b>code</b>: <i>${user.code}</i>
<b>Team Name</b>: <i>${user.teamName}</i>
<b>Team location ponit</b>: <i>${user.locationPoint}</i>
<b>Team all ponit</b>: <i>${user.allPoint + user.locationPoint}</i>
<b>location</b>: <i>${user.locationData && user.locationData.name || "doesn't exist"}</i>
<b>locationTime</b>: <i>${userTimes.locationTime}</i>
<b>game</b>: <i>${user.gameData && user.gameData.name || "doesn't exist"}</i>
<b>gameTime</b>: <i>${userTimes.gameTime}</i>
<b>gameLocation</b>: <i>${user.playingGameData && user.playingGameData.location || "doesn't exist"}</i>
`,
        {parse_mode: 'HTML'})
    }
  }
}

module.exports = {
  scheduleFunction
}
