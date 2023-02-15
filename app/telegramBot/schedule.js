const {userAggregate, getUserInfo, getUserById, updateUser} = require("../api/user/user");
const moment = require("moment");
const {getLocationDataById} = require("../api/location/location");
const {getPlayerGameAndLocationTimes} = require("./game");
const scheduleFunction = async (bot) => {
  try {
    const playersGameTime = await userAggregate([
      {
        $match: {
          role: 'player'
        }
      },
      {
        $match: {
          playingGameTime: {$exists: true}
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
          playingLocationTime: {$exists: true}
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
      for (const playersLocation of playersLocationTime) {
        // console.log(123, moment().diff(playersLocation.playingLocationTime, 'minutes'));
        const locationData = await getLocationDataById(playersLocation.playingLocationId)
        const [player] = await getUserInfo(playersLocation.code)
        const userTimes = await getPlayerGameAndLocationTimes(player.id)
        await bot.telegram.sendMessage(player.chatTo,
          `<b>Location</b>
Time will end in ${+process.env.notificationTimeInMinutes} minutes
<b>Location Name</b>: <i>${locationData.name}</i>
<b>code</b>: <i>${player.code}</i>
<b>Team Name</b>: <i>${player.teamName}</i>
<b>Team location point</b>: <i>${player.locationPoint}</i>
<b>Team all point</b>: <i>${player.allPoint + player.locationPoint}</i>
<b>location</b>: <i>${player.locationData && player.locationData.name || "doesn't exist"}</i>
<b>locationTime</b>: <i>${userTimes?.locationTime}</i>
<b>game</b>: <i>${player.gameData && player.gameData.name || "doesn't exist"}</i>
<b>gameTime</b>: <i>${userTimes?.gameTime}</i>
`,
          {parse_mode: 'HTML'})
      }
    }
    if (playersGameTime.length) {
      for (const playersGame of playersGameTime) {
        const player = await getUserById(playersGame.id)
        const userTimes = await getPlayerGameAndLocationTimes(player.id)
        const locationData = await getLocationDataById(player.playingLocationId)
        await bot.telegram.sendMessage(player.id, `Խաղը ավարտելու համար ձեզ մնացել է <b>${process.env.notificationTimeInMinutes}</b> րոպե`, {
          parse_mode: 'html'
        })
        await bot.telegram.sendMessage(player.chatTo,
          `<B>Game</B>
Time will end in ${process.env.notificationTimeInMinutes} minutes
<b>Location Name</b>: <i>${locationData.name}</i>
<b>code</b>: <i>${player.code}</i>
<b>Team Name</b>: <i>${player.teamName}</i>
<b>Team location point</b>: <i>${player.locationPoint}</i>
<b>Team all point</b>: <i>${player.allPoint + player.locationPoint}</i>
<b>location</b>: <i>${player.locationData && player.locationData.name || "doesn't exist"}</i>
<b>locationTime</b>: <i>${userTimes?.locationTime}</i>
<b>game</b>: <i>${player.gameData && player.gameData.name || "doesn't exist"}</i>
<b>gameTime</b>: <i>${userTimes?.gameTime}</i>
<b>gameLocation</b>: <i>${player.playingGameData && player.playingGameData.location || "doesn't exist"}</i>
`,
          {parse_mode: 'HTML'})
      }
    }
  } catch (e) {
    console.log('schedule', 'ERROR', e);
  }
}

module.exports = {
  scheduleFunction
}
