const Game = require("../api/clue/clue.schema");
const Users = require("../api/user/user.schema");
const Messages = require("../api/messages/messages.schema");
const { updateUserByTelegramId, getUserByTelegramId } = require("../api/user/user");
const { Telegraf } = require("telegraf");
const { getLocationDataById } = require("../api/location/location");
const { getClueById, updateClue } = require("../api/clue/clue");
const { newMessage } = require("../api/messages/messages");
const moment = require("moment");
const { getFile, getFileType } = require("../api/file/file");
const {Clues} = require("../api/clue/clue");

const bot = new Telegraf(process.env.botToken, {
  polling: true,
});
//todo: what is doing
const deleteMessagesFunction = async (userId) => {
  const deleteMessages = await Messages.find({
    userId,
    messagesType: "delete",
    status: "active",
  });
  if (deleteMessages.length) {
    for (const deleteMessage of deleteMessages) {
      bot.telegram
        .deleteMessage(userId, deleteMessage.messageId)
        .then()
        .catch(async (err) => {
          console.log(2222, err);
          await Messages.updateMany(
            {
              userId,
              messagesType: "delete",
            },
            {
              status: "deleted",
            }
          );
        });
    }
    await Messages.updateMany(
      {
        userId,
        messagesType: "delete",
      },
      {
        status: "deleted",
      }
    );
  }
};

const showGame = async ({ ctx, text:gametext }) => {
  try {
    await deleteMessagesFunction(ctx.state.userId);
    const gameStatus = await checkUserGameStatus(ctx.state.userId);
    if (gameStatus) {
      console.log(gametext)
      const [, locationGameText] = gametext.split("/");
      const [, locationGameId] = locationGameText.split("=");
      const gameData = await Game.findById(locationGameId);
      if (gameData.nowPlaying >= gameData.maxPlayerCount) {
        await ctx.reply(`Այս խաղում ազատ տեղեր չեն մնացել`, {
          parse_mode: "HTML",
        });
        await showGameMenu(ctx.state.userId);
        return false;
      }
      if (gameData.locationFromGoogle) {
        const deleteMessage = await ctx.replyWithLocation(
          ...gameData.locationFromGoogle.split(", ")
        );
        await newMessage({
          messageId: deleteMessage.message_id,
          userId: ctx.state.userId,
        });
      }
      const gameButtons = [
        [
          {text: `Սկսել խաղը`, callback_data: `gTo:pG/lGId=${locationGameId}`}, // pG = playGame, gTo = gameTo, lGId = locationGameId,
          {
            text: `🔙 գնալ հետ ↩`,
            callback_data: `gTo:gM/lGId=${locationGameId}`,
          },
        ], // gM = gameMenu, gTo = gameTo
      ];
      await ctx
        .reply(`<b>${gameData.name}</b>: <i>${gameData.point}</i>`, {
          parse_mode: "HTML",
        })
        .then(async (e) => {
          await newMessage({
            messageId: e.message_id,
            userId: ctx.state.userId,
          });
        });
      let text = gameData.description;
        if (gameData.playTime) {
            text += `\nԺամանակը՝ ${gameData.playTime} րոպե`;
        }
      await ctx
        .reply(
          text,
          {reply_markup: JSON.stringify({inline_keyboard: gameButtons})}
        )
        .then(async (e) => {
          await newMessage({
            messageId: e.message_id,
            userId: ctx.state.userId,
          });
        });
    }
  } catch (e) {
    console.log('showGame', 'ERROR: ' + e);
  }
};
const playGame = async ({ ctx, text }) => {
  const gameStatus = await checkUserGameStatus(ctx.state.userId);
  ctx.deleteMessage().catch((err) => {
    console.log(err);
  });
  if (gameStatus) {
    const [, locationGame] = text.split("/");
    const [, locationGameId] = locationGame.split("=");
    const gameData = await Game.findById(locationGameId);
    if (gameData.nowPlaying >= gameData.maxPlayerCount) {
      await ctx.reply(`Այս խաղում ազատ տեղեր չեն մնացել`, {
        parse_mode: "HTML",
      });
      await showGameMenu(ctx.state.userId);
      return false;
    }
    await updateClue(
      { _id: gameData._id },
      {
        $inc: {
          nowPlaying: +1,
        },
      }
    );
    await Users.updateOne(
      { telegramId: ctx.state.userId },
      {
        playingGameId: gameData._id,
        $push: { playedGames: gameData.clueCode||gameData._id },
        playingGameTime: moment().add(gameData.playTime, "minutes"),
      }
    );
    await ctx.reply(
      `<b>Այժմ դուք խաղում եք <i>${gameData.name}</i> խաղը</b>
${gameData.fullDescription}`,
      {
        parse_mode: "html",
      }
    );
    if (gameData.fileName) {
      const message = await ctx.reply(`<i>Uploading file ...</i>`, {
        parse_mode: "html",
      });
      try {
        const type = await getFileType(gameData.fileName);
        const buffer = getFile(gameData.fileName);
        switch (type.mime.split("/")[0]) {
          case "image":
            await ctx
              .replyWithPhoto({ source: buffer, filename: gameData.fileName })
              .then(async (e) => {
                await bot.telegram
                  .deleteMessage(ctx.state.userId, message.message_id)
                  .then()
                  .catch(async (err) => {
                    console.log(2222, err);
                    await Messages.updateMany(
                      {
                        userId: ctx.state.userId,
                        messagesType: "delete",
                      },
                      {
                        status: "deleted",
                      }
                    );
                  });
              });
            break;
          case "video":
            await ctx
              .replyWithVideo({ source: buffer, filename: gameData.fileName })
              .then(async (e) => {
                await bot.telegram
                  .deleteMessage(ctx.state.userId, message.message_id)
                  .then()
                  .catch(async (err) => {
                    console.log(2222, err);
                    await Messages.updateMany(
                      {
                        userId: ctx.state.userId,
                        messagesType: "delete",
                      },
                      {
                        status: "deleted",
                      }
                    );
                  });
              });
            break;
          default:
            await ctx
              .replyWithDocument({
                source: buffer,
                filename: gameData.fileName,
              })
              .then(async (e) => {
                await bot.telegram
                  .deleteMessage(ctx.state.userId, message.message_id)
                  .then()
                  .catch(async (err) => {
                    console.log(2222, err);
                    await Messages.updateMany(
                      {
                        userId: ctx.state.userId,
                        messagesType: "delete",
                      },
                      {
                        status: "deleted",
                      }
                    );
                  });
              });
            break;
        }
      } catch (e) {
        console.log("file error", e);
      }
    }
  }
};

// Game Menu
const showGameMenu = async (userTelegramId) => {
  try {

    await checkUserGameStatus(userTelegramId, false);//???
    const user = await getUserByTelegramId(userTelegramId);
    await deleteMessagesFunction(userTelegramId);//???
    if (user.role === "admin") {
      await bot.telegram.sendMessage(userTelegramId, "Դուք ադմին եք, դուք չունեք միավորներ");
      return false;
    }

    const location = await getLocationDataById(user.playingLocationId.toString());
    if(!location){
      throw new Error("Location not found for the user");
    }
    if (user.playStatus === "finishGames") {
      await bot.telegram.sendMessage(
        userTelegramId,//todo
        "Դուք Վերջացրեցիք բոլոր խաղերը!!! Այժմ գնացեք Վիկտորիա հյուրանոց, որպեսզի հավաքենք Փազլը"
      );
    } else if (user.playStatus === "goingLocation"&&location?.needToGoBeforeStart) {
      // const location = await getLocationDataById(user.playingLocationId);
      await bot.telegram.sendMessage(userTelegramId, location.startDescription);
    } else if (user.playingGameId) {
      await bot.telegram.sendMessage(
        userTelegramId,
        "Դուք դեռ խաղի ընթացքի մեջ եք և այդ պատճառով խաղերին հասանելիություն չունեք։"
      );
    } else {
      const userGames = await Users.findOne({ telegramId: userTelegramId });
      const clueType = user.playStatus !== "playingGame" ? "levelUp" : "standardGame";
      const games = await Clues.aggregate([
         { $match: { locationId: user.playingLocationId } },
        {
          $match: {
            clueCode: {
              $not: {
                $in: userGames.playedGames,
              },
            },
          },
        },
        {
          $match: {
            clueType,
          },
        },
        {
          $match: {
            $expr: { $gt: ["$maxPlayersSameTime", "$nowPlaying"] },
          },
        },
      ]);
      let gameButtonsArray = [];
      for (const game of games) {
        gameButtonsArray.unshift(
          {
            text: `${game.name}: ${game.point}`,
            callback_data: `gTo:gId/lG=${game._id}`,
          } // gId = gameId
        );
      }
      const gameButtons = [];
      while (gameButtonsArray.length)
        gameButtons.push(
          gameButtonsArray.splice(0, +process.env.buttonCountInRow)
        );
      await bot.telegram
        .sendMessage(userTelegramId, `Առաջադրանքները`, {
          reply_markup: JSON.stringify({ inline_keyboard: gameButtons }),
        })
        .then(async (e) => {
          await newMessage({
            messageId: e.message_id,
            userId: userTelegramId,
          });
        });
    }
  } catch (e) {
    const user = await getUserByTelegramId(userTelegramId);
    const adminId = await getUserByTelegramId(user.adminId).telegramId;
    await bot.telegram.sendMessage(adminId, "Սխալ է տեղի ունեցել։"+ e.message);
    console.log(1111, e);
  }
};
const approveGame = async ({ ctx, text }) => {
  ctx.deleteMessage().catch((err) => {
    console.log(err);
  });
  const [, user] = text.split("/");
  const [, userId] = user.split("=");
  const player = await getUserByTelegramId(userId);
  if (player.playStatus === "playingGame") {
    const game = await getClueById(player.playingGameId);
    await updateClue(
      { _id: player.playingGameId },
      {
        $inc: {
          nowPlaying: -1,
        },
      }
    );
    await updateUserByTelegramId({
      telegramId: userId,
      data: {
        playingGameId: undefined,
        $unset: { playingGameTime: "" },
        $inc: {
          locationPoint: +game.point,
        },
      },
    });
    await ctx.telegram.sendMessage(
      userId,
      `Շնորհավորում եմ դուք հաղթահարեցիք այս առաջադրանքը և վաստակել եք <b>${game.point}</b> միավոր։`,
      {
        parse_mode: "HTML",
      }
    );
  } else if (player.playStatus === "playingLevelUp") {
    const playingLocationStep = player.playingLocationSteps.indexOf(
      player.playingLocationId
    );
    if (playingLocationStep < player.playingLocationSteps.length - 1) {
      // if playing in last location

      const nextLocationId = player.playingLocationSteps[playingLocationStep + 1];
      if(nextLocationId) {
        await updateUserByTelegramId({
          telegramId: player.telegramId,
          data: {
            playingLocationId:
            nextLocationId,
            $inc: {
              allPoint: +player.locationPoint,
            },
            locationPoint: 0,
            playStatus: nextPlayStatus,
            playingGameId: undefined,
            $unset: {playingLocationTime: "", playingGameTime: ""},
          },
        });
        await ctx.telegram.sendMessage(
            userId,
            "Շնորհավորում եմ դուք հաղթահարել եք այս տարածքի խաղերը։\nՀաջորդիվ ուղևորվեք..."
        );
      }
    } else {
      await updateUserByTelegramId({
        telegramId: player.telegramId,
        data: {
          $inc: {
            allPoint: +player.locationPoint,
          },
          locationPoint: 0,
          playStatus: "finishGames",
          playingGameId: undefined,
        },
      });
    }
  }
  // await bot.telegram.sendMessage(userId, 'Դուք ավարտեցիք Խաղը')
  await showGameMenu(userId);
};
const rejectGame = async ({ ctx, text }) => {
  await reject({ ctx, text });
};
const approveLocation = async ({ ctx, text }) => {
  ctx.deleteMessage().catch((err) => {
    console.log(err);
  });
  const [, user] = text.split("/");
  const [, userId] = user.split("=");
  const userData = await getUserByTelegramId(userId);
  const locationData = await getLocationDataById(userData.playingLocationId);
  await updateUserByTelegramId({
    telegramId: userId,
    data: {
      playStatus: "playingGame",
      playingLocationTime: moment().add(locationData.finishTime, "minutes"),
    },
  });
  await ctx.telegram.sendMessage(userId, "Դուք հասել եք նշված վայր");
  await showGameMenu(userId);
};
const rejectLocation = async ({ ctx, text }) => {
  await reject({ ctx, text });
};
const reject = async ({ ctx, text }) => {
  ctx.deleteMessage().catch((err) => {
    console.log(err);
  });
  const [, user] = text.split("/");
  const [, userId] = user.split("=");
  await ctx.telegram.sendMessage(
    userId,
    "Ձեր ուղարկված պատասխանը անվավեր է ճանաչվել մեր ադմինների կողմից։ Խնդրում ենք նորից փորձել։"
  );
};

const showInfo = async (ctx) => {
  const { user,userId } = await ctx.state;
  const timesInfo = await getPlayerGameAndLocationTimes(userId);
  if (user.role === "admin") {
    await bot.telegram.sendMessage(userId, "you are Admin");
    return false;
  }
  const teamNameText = `Սիրելի <b>${user.teamName}</b> թիմ,`;
  const allPointText =
    !user.locationPoint && !user.allPoint
      ? `դուք դեռ չունեք միավորներ`
      : `դուք ունեք  <b><i>${
          user.locationPoint + user.allPoint
        }</i></b> միավոր`;
  // const locationPoint = user.locationPoint
  //   ? `ձեր միավորները <b><i>${user.locationPoint}</i></b> են`
  //   : ` դուք դեռ չունեք միավորներ`;
  const locationText =
    timesInfo.locationTime === "noTime"
      ? false
      : timesInfo.locationTime < 1
      ? `Տարածքի Խաղերը ավարտելու համար ձեզ ժամանակ չի մնացել`
      : `Տարածքի Խաղերը ավարտելու համար ձեզ մնացել է <b><i>${timesInfo.locationTime}</i></b> րոպե`;
  const gameText =
    timesInfo.gameTime === "noTime"
      ? false
      : timesInfo.gameTime < 1
      ? `Խաղը ավարտելու համար ձեզ ժամանակ չի մնացել`
      : `Խաղը ավարտելու համար ձեզ մնացել է <b><i>${timesInfo.gameTime}</i></b> րոպե`;

//   await ctx.reply(
//     `${teamNameText}
// ${allPointText}
// ${locationPoint}
//
// ${locationText ? locationText : ""}
//
// ${timesInfo.locationTime >= 1 && gameText ? gameText : ""}
// `,
//     {
//       parse_mode: "HTML",
//     }
//   );
  await ctx.reply(
    `${teamNameText}
${allPointText}

${locationText ? locationText : ""}

${timesInfo.locationTime >= 1 && gameText ? gameText : ""}
`,
    {
      parse_mode: "HTML",
    }
  );
};

const sendWelcomeMessage = (ctx) => {
  if (ctx.state.userId) {
    showGameMenu(ctx.state.userId).then();
  } else {
    ctx.reply(
      `Բարի գալուստ։
Շնորհավորում ենք դուք ունեք բացառիկ հնարավորություն մասնակցելու 
<b>All Inclusive Armenia</b> 
ընկերության կողմից կազմակերպված Գյումրիում տեղի ունեցող քաղաքային քվեստին։ 
Ձեզ սպասվում են հետաքրքիր ու յուրահատուկ խաղեր, որոնք երբևէ չեք խաղացել։
Ձեր խաղավարների մոտ կան թղթապանակներ, դրա մեջ գտնվող իրերը օգնելու են հաղթահարել մեր խաղերը։ 
Գտեք այնտեղից առաջին խաղը։ 
Այն լուծելու արդյունքում ուղարկեք մեզ ձեր թիմի կոդը, որպեսզի շարունակենք խաղալ։`,
      {
        parse_mode: "HTML",
      }
    );
  }
};

const editTeamName = async (ctx) => {
  await updateUserByTelegramId({
    telegramId: ctx.state.userId,
    data: {
      updatingTeamName: true,
    },
  });
  await ctx.reply(`Մուտքագրեք նոր թիմի անուն`, {
    parse_mode: "html",
  });
};

const checkUserGameStatus = async (userTelegramId, showGameMenuParam = true) => {
  try {
    const user = await getUserByTelegramId(userTelegramId);
    const locationData = await getLocationDataById(user.playingLocationId);
    let nextPlayStatus =
      user.locationPoint < locationData.finishPoint
        ? "playingGame"
        : "playingLevelUp"; //todo: change this becuaus it can be bugged now jus will use lllong time
    const times = await getPlayerGameAndLocationTimes(userTelegramId);
    if (
      times.locationTime <= +process.env.notificationTimeInMinutes &&
      user.playStatus === "playingGame"
    ) {
      await updateUserByTelegramId({
        telegramId: userTelegramId,
        data: {
          playStatus: "playingLevelUp",
        },
      });
      await bot.telegram.sendMessage(
        userTelegramId,
        `Շնորհավորում ենք դուք հաղթահարեցիք մեր փորձությունները, որպեսզի կարողանանք հավաքել մեր վերջնական փազլը կատարեք այս վերջին առաջադրանքը`,
        {
          parse_mode: "HTML",
        }
      );
      showGameMenuParam && (await showGameMenu(userTelegramId));
      return false;
    }
    if (user.playStatus === "playingGame" && nextPlayStatus === "playingLevelUp") {
      await updateUserByTelegramId({
        telegramId: userTelegramId,
        data: {
          playStatus: nextPlayStatus,
        },
      });
      await bot.telegram.sendMessage(
        userTelegramId,
        `Դուք հավաքեցիք բավականաչափ միավոր <b>Level Up</b> խաղալու համար`,
        {
          parse_mode: "HTML",
        }
      );
      showGameMenuParam && (await showGameMenu(userTelegramId));
      return false;
    }
    if (user.playStatus === "goingLocation"&&! locationData.needToGoBeforeStart) {

      await updateUserByTelegramId({
        telegramId: userTelegramId,
        data: {
          playStatus: "playingGame",
        },
      });
    }
    return true;
  } catch (e) {
    console.log(2222, e);
  }
};

const getPlayerGameAndLocationTimes = async (userId) => {
  const user = await getUserByTelegramId(userId);
  const gameTime = user.playingGameTime
    ? -1 * moment().diff(user.playingGameTime, "minute")
    : "noTime";
  const locationTime = user.playingLocationTime
    ? -1 * moment().diff(user.playingLocationTime, "minute")
    : "noTime";
  return {
    gameTime,
    locationTime,
  };
};

const gameTo = async (ctx) => {
  try {
    const [, text] = ctx.update.callback_query.data.split(":");
    const [command] = text.split("/");
    switch (command) {
      case "gId":
        await showGame({ ctx, text });
        break;
      case "gM":
        await showGameMenu(ctx.state.userId);
        break;
      case "pG":
        await playGame({ ctx, text });
        break;
      case "appG":
        await approveGame({ ctx, text });
        break;
      case "rejG":
        await rejectGame({ ctx, text });
        break;
      case "appL":
        await approveLocation({ ctx, text });
        break;
      case "rejL":
        await rejectLocation({ ctx, text });
        break;
    }
    return false;
  } catch (e) {
    console.log(2222, e);
  }
};
const onMessageTo = async (ctx) => {
  try {


      const [, uId, messageId] = ctx.update.callback_query.data.split(":");
      await ctx.answerCbQuery();
      await ctx.reply(`Send your answer to user ${uId}`, {//ete aystex poxeq,
        reply_markup: {
          force_reply: true // Set the `force_reply` property to true to ensure that the user's message is treated as a reply
        },
      })


  }
    catch (e) {


    }
}


async function playerInfoText(user) {
  const userTimes = await getPlayerGameAndLocationTimes(user.telegramId)
  const game = user.playingGameId && (await getClueById(user.playingGameId))
  // const userLocation = await getLocationDataById(user.playingLocationId);
  //todo: show map instead of google location lat, long
  return `
<b>code</b>: <i>${user.code}</i>
<b>Team Name</b>: <i>${user.teamName}</i>
<b>Team location point</b>: <i>${user.locationPoint}</i>
<b>Team all point</b>: <i>${user.allPoint + user.locationPoint}</i>
<b>Team playing status</b>: <i>${user.playStatus}</i>
<b>game</b>: <i>${game && game.name || "doesn't exist"}</i>
<b>Game remaining time</b>: <i>${userTimes.gameTime}</i>
<b>Game Location Name</b>: <i>${game && game.populate("location")?.name || "doesn't exist"}</i>
<b>Game Google Location</b>: <i>${game && game.locationFromGoogle || "doesn't exist"}</i>

          `;
}
module.exports = {
  getPlayerGameAndLocationTimes,
  checkUserGameStatus,
  showGameMenu,
  editTeamName,
  gameTo,
  showInfo,
  sendWelcomeMessage,
    playerInfoText,
  onMessageTo
};
