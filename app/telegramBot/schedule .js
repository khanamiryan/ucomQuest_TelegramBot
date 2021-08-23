const {getOnlyPLayers, userAggregate} = require("../api/user/user");
const moment = require("moment");
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
          $lte: new Date(),
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
          $lte: new Date(),
        }
      }
    }
  ])
  console.log('playersGameTime', playersGameTime);
  console.log('playersLocationTime', playersLocationTime);
  console.log(Date.now());
}

module.exports = {
  scheduleFunction
}
