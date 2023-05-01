const {
  userAggregate,
  getUserInfo,
  getUserByTelegramId,
  updateUserByTelegramId,
  getUserById,
} = require("../api/user/user");
const moment = require("moment");
const { getLocationDataById } = require("../api/location/location");
const {
  getPlayerGameAndLocationTimes,
  getPlayerInfoText,
  stopPlayingClue,
  stopLocationAndGoToNext,
  stopLocationAndGoToLevelUp,
  showGameMenu,
} = require("./game");

const mongoose = require("mongoose");

const { store } = require("../bot");
const { session, Scenes } = require("telegraf");
// const { enterToLocationScene } = require("./scenes");

const { enter, leave, reenter, reply } = Scenes.Stage;

const scheduleFunction = async (bot) => {
  try {
    //todo : motaka xaxin sa petq chi, dra hamar toxum enq kisat
    //await checkLocationTimeAlmostOver(bot);
    // await checkLocationTimeOver(bot);
    await checkClueTimeAlmostOver(bot);
    await checkClueTimeOver(bot);
  } catch (e) {
    console.log("schedule", "ERROR", e);
  }
};
async function checkLocationTimeAlmostOver(bot) {
  const playersLocationTime = await userAggregate([
    {
      $match: {
        role: "player",
      },
    },
    {
      $match: {
        playingLocationTime: { $exists: true },
      },
    },
    {
      $match: {
        playingLocationTime: {
          $lte: new Date(moment().add(+process.env.notificationTimeInMinutes + 1, "minutes")),
          $gte: new Date(moment().add(+process.env.notificationTimeInMinutes, "minutes")),
        },
      },
    },
  ]);
  if (playersLocationTime.length) {
    for (const playersLocation of playersLocationTime) {
      // console.log(123, moment().diff(playersLocation.playingLocationTime, 'minutes'));
      const locationData = await getLocationDataById(playersLocation.playingLocationId);
      const [player] = await getUserInfo(playersLocation.code);
      const userTimes = await getPlayerGameAndLocationTimes(player.telegramId);
      const adminChatId = await getUserById(player.adminId)?.telegramId;
      await bot.telegram.sendMessage(
          adminChatId,
          `<b>Location</b>
Time will end in ${+process.env.notificationTimeInMinutes} minutes
<b>Location Name</b>: <i>${locationData.name}</i>
<b>code</b>: <i>${player.code}</i>
<b>Team Name</b>: <i>${player.teamName}</i>
<b>Team location point</b>: <i>${player.locationPoint}</i>
<b>Team all point</b>: <i>${player.allPoint}</i>
<b>location</b>: <i>${(player.locationData && player.locationData.name) || "doesn't exist"}</i>
<b>locationTime</b>: <i>${userTimes?.locationTime}</i>
<b>game</b>: <i>${(player.gameData && player.gameData.name) || "doesn't exist"}</i>
<b>gameTime</b>: <i>${userTimes?.gameTime}</i>
`,
          { parse_mode: "HTML" }
      );
    }
  }
}

async function checkClueTimeAlmostOver(bot) {
  const playersGameTime = await userAggregate([
    {
      $match: {
        role: "player",
      },
    },
    {
      $match: {
        playingClueTime: { $exists: true },
      },
    },
    {
      $match: {
        playingClueTime: {
          $lte: new Date(moment().add(+process.env.notificationTimeInMinutes + 1, "minutes")),
          $gte: new Date(moment().add(+process.env.notificationTimeInMinutes, "minutes")),
        },
      },
    },
  ]);
  if (playersGameTime.length) {
    for (const playersGame of playersGameTime) {
      const adminChatId = await getUserById(playersGame.adminId);
      const player = await getUserByTelegramId(adminChatId);
      const userTimes = await getPlayerGameAndLocationTimes(player.telegramId);
      const locationData = await getLocationDataById(player.playingLocationId);
      await bot.telegram.sendMessage(
          player.telegramId,
          `Խաղը ավարտելու համար ձեզ մնացել է <b>${process.env.notificationTimeInMinutes}</b> րոպե`,
          {
            parse_mode: "html",
          }
      );
      await bot.telegram.sendMessage(
          adminChatId,
          `<B>Game</B>
Time will end in ${process.env.notificationTimeInMinutes} minutes
<b>Location Name</b>: <i>${locationData.name}</i>
<b>code</b>: <i>${player.code}</i>
<b>Team Name</b>: <i>${player.teamName}</i>
<b>Team location point</b>: <i>${player.locationPoint}</i>
<b>Team all point</b>: <i>${player.allPoint}</i>
<b>location</b>: <i>${(player.locationData && player.locationData.name) || "doesn't exist"}</i>
<b>locationTime</b>: <i>${userTimes?.locationTime}</i>
<b>game</b>: <i>${(player.gameData && player.gameData.name) || "doesn't exist"}</i>
<b>gameTime</b>: <i>${userTimes?.gameTime}</i>
<b>gameLocation</b>: <i>${
              (player.playingClueData && player.playingClueData.locationFromGoogle) || "doesn't exist"
          }</i>
`,
          { parse_mode: "HTML" }
      );
    }
  }
}

//if location time is over, playing levelUp clue
async function checkLocationTimeOver(bot) {
  const playersLocationTime = await userAggregate([
    {
      $match: {
        role: "player",
      },
    },
    {
      $match: {
        playingLocationTime: { $exists: true },
      },
    },
    {
      $match: {
        playingLocationTime: {
          $lt: new Date(moment()),
        },
      },
    },
  ]);
  if (playersLocationTime?.length) {
    for (const player of playersLocationTime) {
      // const [player] = await getUserInfo(playersLocation.code)
      // await stopLocationAndGoToNext(player);
      const admin = await getUserById(player.adminId);
      const adminChatId = admin?.telegramId;
      const playerInfoText = await getPlayerInfoText(player);
      await stopLocationAndGoToLevelUp(player);
      await bot.telegram.sendMessage(
          player.telegramId,
          `<b>Location</b>
Ձեր տարածքի ժամանակը ավարտվել է․․․   
Ընթացիկ առաջադրանքը չեղարկվել է․․․
Level Up առաջադրանքը սկսվում է․․․
`,
          { parse_mode: "HTML" }
      );
      adminChatId &&
      (await bot.telegram.sendMessage(
          adminChatId,
          `<b>Location</b>
Խաղացողի տարածքի ժամանակը ավարտվել է․․․  
${playerInfoText}
`,
          { parse_mode: "HTML" }
      ));
    }
  }
}
//create function to check game time over
async function checkClueTimeOver(bot) {
  const playersGameTime = await userAggregate([
    {
      $match: {
        role: "player",
      },
    },
    {
      $match: {
        playingClueTime: { $exists: true },
        playingClueId: { $exists: true },
      },
    },
    {
      $match: {
        playingClueTime: {
          $lt: new Date(moment()),
        },
      },
    },
  ]);
  if (playersGameTime?.length) {
    for (const player of playersGameTime) {
      const admin = await getUserById(player.adminId);
      const adminChatId = admin?.telegramId;

      const playerInfoText = await getPlayerInfoText(player);
      await stopPlayingClue(player);

      // await enterToLocationScene(player.telegramId);

      await bot.telegram.sendMessage(
          player.telegramId,
          `Ժամանակը ավարտվեց, դուք չեք հավաքել միավորներ`,
          {
            parse_mode: "html",
          }
      );
      // await  enter("locationScene")
      showGameMenu(player.telegramId);
      adminChatId &&
      (await bot.telegram.sendMessage(
          adminChatId,
          `<B>Game</B>
Time is over
${playerInfoText}
`,
          { parse_mode: "HTML" }
      ));
    }
  }
}

module.exports = {
  scheduleFunction,
};
