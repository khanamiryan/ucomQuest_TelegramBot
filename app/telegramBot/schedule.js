const {userAggregate, getUserInfo} = require("../api/user/user");
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
Time will end in 5 minutes
<b>Location Name</b>: <i>${locationData.name}</i>
<b>code</b>: <i>${player.code}</i>
<b>Team Name</b>: <i>${player.teamName}</i>
<b>Team location ponit</b>: <i>${player.locationPoint}</i>
<b>location</b>: <i>${player.locationData && player.locationData.name || "doesn't exist"}</i>
<b>game</b>: <i>${player.gameData && player.gameData.name || "doesn't exist"}</i>
<b>gameLocation</b>: <i>${player.playingGameData && player.playingGameData.location || "doesn't exist"}</i>`,
        {parse_mode: 'HTML'})
    }
  }
  if (playersGameTime.length) {
    for(const playersGame of playersGameTime) {
      const [player] = await getUserInfo(playersGame.code)
      const locationData = await getLocationDataById(player.playingLocationId)
      await bot.telegram.sendMessage(player.chatTo,
        `<B>Game</B>
Time will end in 5 minutes
<b>Location Name</b>: <i>${locationData.name}</i>
<b>code</b>: <i>${player.code}</i>
<b>Team Name</b>: <i>${player.teamName}</i>
<b>Team location ponit</b>: <i>${player.locationPoint}</i>
<b>location</b>: <i>${player.locationData && player.locationData.name || "doesn't exist"}</i>
<b>game</b>: <i>${player.gameData && player.gameData.name || "doesn't exist"}</i>
<b>gameLocation</b>: <i>${player.playingGameData && player.playingGameData.location || "doesn't exist"}</i>`,
        {parse_mode: 'HTML'})
    }
  }
}

module.exports = {
  scheduleFunction
}
