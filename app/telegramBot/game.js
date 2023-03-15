const Game = require("../api/game/game.schema");
const Users = require("../api/user/user.schema");
const Messages = require("../api/messages/messages.schema");
const { updateUser, getUserById } = require("../api/user/user");
const { Telegraf } = require("telegraf");
const { getLocationDataById } = require("../api/location/location");
const { getGameById, updateGame } = require("../api/game/game");
const { newMessage } = require("../api/messages/messages");
const moment = require("moment");
const { getFile, getFileType } = require("../api/file/file");
const bot = new Telegraf(process.env.botToken, {
  polling: true,
});
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

const showGame = async ({ ctx, text }) => {
  try {
    await deleteMessagesFunction(ctx.state.userId);
    const gameStatus = await checkUserGameStatus(ctx.state.userId);
    if (gameStatus) {
      const [, locationGameText] = text.split("/");
      const [, locationGameId] = locationGameText.split("=");
      const gameData = await Game.findById(locationGameId);
      if (gameData.nowPlaying >= gameData.maxPlayerCount) {
        await ctx.reply(`Այս խաղում ազատ տեղեր չեն մնացել`, {
          parse_mode: "HTML",
        });
        await showGameMenu(ctx.state.userId);
        return false;
      }
      if (gameData.location) {
        const deleteMessage = await ctx.replyWithLocation(
          ...gameData.location.split(", ")
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
      await ctx
        .reply(
          `${gameData.description}
Ժամանակը՝ ${gameData.gamePlayTime} րոպե`,
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
    await updateGame(
      { _id: gameData._id },
      {
        $inc: {
          nowPlaying: +1,
        },
      }
    );
    await Users.updateOne(
      { id: ctx.state.userId },
      {
        playingGameId: gameData._id,
        $push: { playedGames: gameData.gameCode },
        playingGameTime: moment().add(gameData.gamePlayTime, "minutes"),
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
                  .deleteMessage(ctx.state.user.id, message.message_id)
                  .then()
                  .catch(async (err) => {
                    console.log(2222, err);
                    await Messages.updateMany(
                      {
                        userId: ctx.state.user.id,
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
                  .deleteMessage(ctx.state.user.id, message.message_id)
                  .then()
                  .catch(async (err) => {
                    console.log(2222, err);
                    await Messages.updateMany(
                      {
                        userId: ctx.state.user.id,
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
                  .deleteMessage(ctx.state.user.id, message.message_id)
                  .then()
                  .catch(async (err) => {
                    console.log(2222, err);
                    await Messages.updateMany(
                      {
                        userId: ctx.state.user.id,
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
const showGameMenu = async (userId) => {
  try {
    await checkUserGameStatus(userId, false);
    const user = await getUserById(userId);
    await deleteMessagesFunction(userId);
    if (user.role === "admin") {
      await bot.telegram.sendMessage(userId, "you are Admin");
      return false;
    }
    if (user.playStatus === "finishGames") {
      await bot.telegram.sendMessage(
        userId,
        "Դուք Վերջացրեցիք բոլոր խաղերը!!! Այժմ գնացեք Վիկտորիա հյուրանոց, որպեսզի հավաքենք Փազլը"
      );
    } else if (user.playStatus === "goingLocation") {
      const location = await getLocationDataById(user.playingLocationId);
      await bot.telegram.sendMessage(userId, location.startDescription);
    } else if (user.playingGameId) {
      await bot.telegram.sendMessage(
        userId,
        "Դուք դեռ խաղի ընթացքի մեջ եք և այդ պատճառով խաղերին հասանելիություն չունեք։"
      );
    } else {
      const userGames = await Users.aggregate([{ $match: { id: userId } }]);
      const gameType =
        user.playStatus === "playingGame" ? "standardGame" : "levelUp";
      const games = await Game.aggregate([
        { $match: { locationId: user.playingLocationId } },
        {
          $match: {
            gameCode: {
              $not: {
                $in: userGames[0].playedGames,
              },
            },
          },
        },
        {
          $match: {
            gameType,
          },
        },
        {
          $match: {
            $expr: { $gt: ["$maxPlayerCount", "$nowPlaying"] },
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
        .sendMessage(userId, `Խաղերը`, {
          reply_markup: JSON.stringify({ inline_keyboard: gameButtons }),
        })
        .then(async (e) => {
          await newMessage({
            messageId: e.message_id,
            userId,
          });
        });
    }
  } catch (e) {
    console.log(1111, e);
  }
};
const approveGame = async ({ ctx, text }) => {
  ctx.deleteMessage().catch((err) => {
    console.log(err);
  });
  const [, user] = text.split("/");
  const [, userId] = user.split("=");
  const userData = await getUserById(userId);
  if (userData.playStatus === "playingGame") {
    const game = await getGameById(userData.playingGameId);
    await updateGame(
      { _id: userData.playingGameId },
      {
        $inc: {
          nowPlaying: -1,
        },
      }
    );
    await updateUser({
      id: userId,
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
      `Շնորհավորում եմ դուք հաղթահարեցիք այս խաղը և վաստակել եք <b>${game.point}</b> միավոր։`,
      {
        parse_mode: "HTML",
      }
    );
  } else if (userData.playStatus === "playingLevelUp") {
    const playingLocationStep = userData.playingLocationSteps.indexOf(
      userData.playingLocationId
    );
    if (playingLocationStep < userData.playingLocationSteps.length - 1) {
      // if playing in last location
      await updateUser({
        id: userData.id,
        data: {
          playingLocationId:
            userData.playingLocationSteps[playingLocationStep + 1],
          $inc: {
            allPoint: +userData.locationPoint,
          },
          locationPoint: 0,
          playStatus: "goingLocation",
          playingGameId: undefined,
          $unset: { playingLocationTime: "", playingGameTime: "" },
        },
      });
      await ctx.telegram.sendMessage(
        userId,
        "Շնորհավորում եմ դուք հաղթահարել եք այս տարածքի խաղերը։\nՀաջորդիվ ուղևորվեք..."
      );
    } else {
      await updateUser({
        id: userData.id,
        data: {
          $inc: {
            allPoint: +userData.locationPoint,
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
  const userData = await getUserById(userId);
  const locationData = await getLocationDataById(userData.playingLocationId);
  await updateUser({
    id: userId,
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
    "Ձեր ուղարկված նկարն անվավեր է ճանաչվել մեր ադմինների կողմից։ Խնդրում ենք նորից փորձել։"
  );
};

const showInfo = async (ctx) => {
  const { user } = await ctx.state;
  const timesInfo = await getPlayerGameAndLocationTimes(user.id);
  if (user.role === "admin") {
    await bot.telegram.sendMessage(user.id, "you are Admin");
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
  await updateUser({
    id: ctx.state.user.id,
    data: {
      updatingTeamName: true,
    },
  });
  await ctx.reply(`Մուտքագրեք նոր թիմի անուն`, {
    parse_mode: "html",
  });
};

const checkUserGameStatus = async (userId, showGameMenuParam = true) => {
  try {
    const user = await getUserById(userId);
    const locationData = await getLocationDataById(user.playingLocationId);
    let playStatus =
      user.locationPoint < locationData.finishPoint
        ? "playingGame"
        : "playingLevelUp";
    const times = await getPlayerGameAndLocationTimes(userId);
    if (
      times.locationTime <= +process.env.notificationTimeInMinutes &&
      user.playStatus === "playingGame"
    ) {
      await updateUser({
        id: userId,
        data: {
          playStatus: "playingLevelUp",
        },
      });
      await bot.telegram.sendMessage(
        userId,
        `Շնորհավորում ենք դուք հաղթահարեցիք մեր փորձությունները, որպեսզի կարողանանք հավաքել մեր վերջնական փազլը կատարեք այս վերջին առաջադրանքը`,
        {
          parse_mode: "HTML",
        }
      );
      showGameMenuParam && (await showGameMenu(userId));
      return false;
    }
    if (user.playStatus === "playingGame" && playStatus === "playingLevelUp") {
      await updateUser({
        id: userId,
        data: {
          playStatus,
        },
      });
      await bot.telegram.sendMessage(
        userId,
        `Դուք հավաքեցիք բավականաչափ միավոր <b>Level Up</b> խաղալու համար`,
        {
          parse_mode: "HTML",
        }
      );
      showGameMenuParam && (await showGameMenu(userId));
      return false;
    }
    return true;
  } catch (e) {
    console.log(2222, e);
  }
};

const getPlayerGameAndLocationTimes = async (userId) => {
  const user = await getUserById(userId);
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

module.exports = {
  getPlayerGameAndLocationTimes,
  checkUserGameStatus,
  showGameMenu,
  editTeamName,
  gameTo,
  showInfo,
  sendWelcomeMessage,
};
