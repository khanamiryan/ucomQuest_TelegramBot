const Clue = require("../api/clue/clue.schema");
const Users = require("../api/user/user.schema");
const Messages = require("../api/messages/messages.schema");
const { updateUserByTelegramId, getUserByTelegramId } = require("../api/user/user");
const { Telegraf, Scenes, session } = require("telegraf");
const { getLocationDataById } = require("../api/location/location");
const { getClueById, updateClue } = require("../api/clue/clue");
const { newMessage } = require("../api/messages/messages");
const moment = require("moment");
const { getFile, getFileType } = require("../api/file/file");
const { Clues } = require("../api/clue/clue");

const { playStatuses,  gameConfig, clueTypes} = require("../docs/constants");

const { sendMessageToUserAdmin } = require("./admin");


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

const showGame = async ({ ctx, text: gametext }) => {
    try {
        await deleteMessagesFunction(ctx.state.userId);
        const gameStatus = await checkUserGameStatus(ctx.state.userId);
        if (gameStatus) {
            const [, locationGameText] = gametext.split("/");
            const [, locationGameId] = locationGameText.split("=");
            const gameData = await Clue.findById(locationGameId);
            if (gameData.nowPlaying >= gameData.maxPlayerCount) {
                await ctx.reply(`Այս խաղում ազատ տեղեր չեն մնացել`, {
                    parse_mode: "HTML",
                });
                await showGameMenu(ctx.state.userId);
                return false;
            }
            if (gameData.locationFromGoogle) {
                try {
                    const deleteMessage = await ctx.replyWithLocation(
                        ...gameData.locationFromGoogle.split(",").map((e) => parseFloat(e.trim()))
                    );
                    await newMessage({
                        messageId: deleteMessage.message_id,
                        userId: ctx.state.userId,
                    });
                } catch (e) {
                    await sendMessageToUserAdmin(
                        ctx.state.userId,
                        `Problem with locationFromGoogle in game ${gameData.name}`
                    );
                }
            }
            const gameButtons = [
                [
                    { text: `Սկսել խաղը`, callback_data: `gTo:pG/lGId=${locationGameId}` }, // pG = playGameCallbackTelegramHadle, gTo = gameTo, lGId = locationGameId,
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
            if (gameData.playTime && gameData.playTime > 0 && gameData.playTime < 100) {
                text += `\nՏևողությունը՝ ${gameData.playTime} րոպե`;
            }
            await ctx
                .reply(text, { reply_markup: JSON.stringify({ inline_keyboard: gameButtons }) })
                .then(async (e) => {
                    await newMessage({
                        messageId: e.message_id,
                        userId: ctx.state.userId,
                    });
                });
        }
    } catch (e) {
        console.log("showGame", "ERROR: " + e);
    }
};
const { enter, leave } = Scenes.Stage;

const handleFileImage = async (ctx, {source, filename}) => {
    try {

        return true;
    }catch (e) {
        console.log("handleFileImage", "ERROR: " + e);
        return false;
    }
}

/**
 * Get filename  of the file in server and send to user
 * @param ctx - bot context /todo get rid of it
 * @param filename - filename in server
 * @returns {Promise<boolean>}
 */
const sendFileToTelegram = async (ctx, filename) => {
    try {
        const type = await getFileType(filename);
        const source = getFile(filename);
        switch (type.mime.split("/")[0]) {
            case "image":
                await ctx.replyWithPhoto({ source, filename });
                break;
            case "video":
                await ctx.replyWithVideo({ source, filename });
                break;
            default:
                await ctx.replyWithDocument({source, filename});
        }
        return true;
    }catch (e) {
        console.log("handleFile", "ERROR: " + e);
        return false;
    }
}
const startPlayClue = async (ctx, clueId) => {
    try {
        const gameData =  await getClueById(clueId);
        if (gameData.nowPlaying >= gameData.maxPlayerCount) {
            await ctx.reply(`Այս խաղում ազատ տեղեր չեն մնացել`, {
                parse_mode: "HTML",
            });
            //todo change maybe to enter scene
            //await showGameMenu(ctx.state.userId);
            return false;
        }

        let message = `<b>Այժմ դուք սկսում եք <i>${gameData.name}</i> առաջադրանքը</b>\n`;
        message += gameData.fullDescription + "\n";
        if (gameData.playTime && gameData.playTime > 0 && gameData.playTime < 100) {
            message += `<b>Տևողությունը ${gameData.playTime} րոպե</b>`;
        }
        await ctx.reply(message, {
            parse_mode: "html",
        });
        if (gameData.fileName) {
            //todo change to some special status
            const message = await ctx.reply(`<i>Uploading file ...</i>`, {
                parse_mode: "html",
            });

            //get file from server and send to user
            await sendFileToTelegram(ctx, gameData.fileName);
            //i dont know what it is doing
            try{
                await bot.telegram
                    .deleteMessage(ctx.state.userId, message.message_id)
            }catch (e) {
                console.log(2222, err);
                await Messages.updateMany(
                    { userId: ctx.state.userId, messagesType: "delete" },
                    { status: "deleted" }
                );
            }
        }
            //todo should it return the user?
        const updatedUser  = await startPlayingClueUpdateSchema(ctx.state.userId, gameData);
        return updatedUser;
    } catch (e) {
        console.log("startPlayClue", "ERROR: " + e);
    }
};

/**
 * Schema part of starting play the clue
 * Update schema of clue, adding +1 to count of playing
 * Update schema of user, adding current clue id and played clues list
 * Return user  updated data
 * @param userTelegramId
 * @param clueData
 * @returns {Promise<user>}
 */
async function startPlayingClueUpdateSchema(userTelegramId, clueData) {
    await updateClue(
        { _id: clueData._id },
        {
            $inc: {
                nowPlaying: +1,
            },
        }
    );
    const playStatus = clueData.clueType === clueTypes.standardGame? playStatuses.playingClue: playStatuses.playingLevelUp;
    const user = await Users.findOneAndUpdate(
        { telegramId: userTelegramId },
        {
            playingClueId: clueData._id,
            playStatus: playStatus,
            $push: { playedGames: clueData.clueCode || clueData._id },
            playingClueTime: moment().add(clueData.playTime, "minutes"),
        },
        { new: true }
    );

    //todo should it return user?
    return user;
}

/**
 * Handling of player's click on the clue start button
 * @param ctx
 * @param text
 * @returns {Promise<unknown>}
 */
const playClueCallbackTelegramHandle = async ({ ctx, text }) => {
    //todo refactor
    try {
        const gameStatus = await checkUserGameStatus(ctx.state.userId);
        ctx.deleteMessage().catch((err) => {
            console.log(err);
        });
        if (gameStatus) {
            const [, locationGame] = text.split("/");
            const [, clueId] = locationGame.split("=");



            // ctx.session.user = user;
            ctx.session.currentClueData = await getClueById(clueId);
            return ctx.scene.enter("clueScene");


            // const gameData = await Clue.findById(locationGameId);

            // if (gameData.nowPlaying >= gameData.maxPlayerCount) {
            //     await ctx.reply(`Այս խաղում ազատ տեղեր չեն մնացել`, {
            //         parse_mode: "HTML",
            //     });
            //     await showGameMenu(ctx.state.userId);
            //     return false;
            // }

            // let message = `<b>Այժմ դուք սկսում եք <i>${gameData.name}</i> առաջադրանքը</b>\n`;
            // message += gameData.fullDescription + "\n";
            // if (gameData.playTime && gameData.playTime > 0 && gameData.playTime < 100) {
            //     message += `<b>Տևողությունը ${gameData.playTime} րոպե</b>`;
            // }
            // await ctx.reply(message, {
            //     parse_mode: "html",
            // });

            // if (gameData.fileName) {
            //     const message = await ctx.reply(`<i>Uploading file ...</i>`, {
            //         parse_mode: "html",
            //     });
            //
            //     const type = await getFileType(gameData.fileName);
            //     const buffer = getFile(gameData.fileName);
            //     switch (type.mime.split("/")[0]) {
            //         case "image":
            //             await ctx
            //                 .replyWithPhoto({ source: buffer, filename: gameData.fileName })
            //                 .then(async (e) => {
            //                     await bot.telegram
            //                         .deleteMessage(ctx.state.userId, message.message_id)
            //                         .then()
            //                         .catch(async (err) => {
            //                             console.log(2222, err);
            //                             await Messages.updateMany(
            //                                 {
            //                                     userId: ctx.state.userId,
            //                                     messagesType: "delete",
            //                                 },
            //                                 {
            //                                     status: "deleted",
            //                                 }
            //                             );
            //                         });
            //                 });
            //             break;
            //         case "video":
            //             await ctx
            //                 .replyWithVideo({ source: buffer, filename: gameData.fileName })
            //                 .then(async (e) => {
            //                     await bot.telegram
            //                         .deleteMessage(ctx.state.userId, message.message_id)
            //                         .then()
            //                         .catch(async (err) => {
            //                             console.log(2222, err);
            //                             await Messages.updateMany(
            //                                 {
            //                                     userId: ctx.state.userId,
            //                                     messagesType: "delete",
            //                                 },
            //                                 {
            //                                     status: "deleted",
            //                                 }
            //                             );
            //                         });
            //                 });
            //             break;
            //         default:
            //             await ctx
            //                 .replyWithDocument({
            //                     source: buffer,
            //                     filename: gameData.fileName,
            //                 })
            //                 .then(async (e) => {
            //                     await bot.telegram
            //                         .deleteMessage(ctx.state.userId, message.message_id)
            //                         .then()
            //                         .catch(async (err) => {
            //                             console.log(2222, err);
            //                             await Messages.updateMany(
            //                                 {
            //                                     userId: ctx.state.userId,
            //                                     messagesType: "delete",
            //                                 },
            //                                 {
            //                                     status: "deleted",
            //                                 }
            //                             );
            //                         });
            //                 });
            //             break;
            //     }
            // }


            // return await enter("clueScene");
        }
    } catch (e) {
        console.log("file error", e);
    }
};

// Game Menu
const showGameMenu = async (userTelegramId) => {
    try {
        await checkUserGameStatus(userTelegramId, false); //???
        const user = await getUserByTelegramId(userTelegramId);
        await deleteMessagesFunction(userTelegramId); //???
        if (user.role === "admin") {
            await bot.telegram.sendMessage(userTelegramId, "Դուք ադմին եք, դուք չունեք միավորներ");
            return false;
        }

        const location = await getLocationDataById(user.playingLocationId.toString());
        if (!location) {
            throw new Error("Location not found for the user");
        }
        if (user.playStatus === "finishGames") {
            await bot.telegram.sendMessage(
                userTelegramId, //todo use mangoose
                "Դուք Վերջացրեցիք բոլոր խաղերը!!!"
            );
        } else if (user.playStatus === "goingLocation" && location?.needToGoBeforeStart) {
            // const location = await getLocationDataById(user.playingLocationId);
            await bot.telegram.sendMessage(userTelegramId, location.startDescription);
        } else if (user.playingClueId) {
            // const timesInfo = await getPlayerGameAndLocationTimes(userTelegramId);
            //
            // let message = ``;
            // const gameData = await getClueById(user.playingClueId);
            // if (gameData) {
            //     message += `Ձեր առաջադրանքի անունն է <b><i>${gameData.name}</i></b>\n`;
            //     message += `Նկարագրություն\n<b><i>${gameData.fullDescription}</i></b>\n`;
            //     if (timesInfo.gameTime > 0 && timesInfo.gameTime < 60) {
            //         message += `Հաղթահարելու համար մնացել է <b><i>${timesInfo.gameTime}</i></b> րոպե\n`;
            //     }
            //     //  message += `<b>Տևողությունը ${gameData.playTime} րոպե</b>\n`
            // }
            //
            // await bot.telegram.sendMessage(
            //     userTelegramId,
            //     message,
            //     {
            //         parse_mode: "HTML",
            //     }
            //     // "Դուք դեռ խաղի ընթացքի մեջ եք և այդ պատճառով խաղերին հասանելիություն չունեք։"
            // );
        } else {
            const userGames = await Users.findOne({ telegramId: userTelegramId });
            const clueType = user.playStatus === "levelUp" ? "levelUp" : "standardGame";

            const games = await getUserAvailableCluesList(userGames, clueType);

            if (clueType === "levelUp" && gameConfig.choosingLevelUpGame){
                //todo or move to anoter plase
                const levelupGame = gameButtonsArray[0];
            } else {
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
                    gameButtons.push(gameButtonsArray.splice(0, +process.env.buttonCountInRow));
                let userMessage = "Առաջադրանքները";
                if (gameButtons.length === 0) {
                    userMessage = "Այս տարածքում առաջադրանքներ չկան";
                }
                await bot.telegram
                    .sendMessage(userTelegramId, userMessage, {
                        reply_markup: JSON.stringify({ inline_keyboard: gameButtons }),
                    })
                    .then(async (e) => {
                        await newMessage({
                            messageId: e.message_id,
                            userId: userTelegramId,
                        });
                    });
            }
        }
    } catch (e) {
        // const user = await getUserByTelegramId(userTelegramId);
        // const adminId = await getUserByTelegramId(user.adminId).telegramId;
        // await bot.telegram.sendMessage(adminId, "Սխալ է տեղի ունեցել։" + e.message);
        console.log(1111, e);
    }
};
const getUserAvailableCluesList = async (user, clueType) =>{
    const clues = await Clues.aggregate([
        {$match: {locationId: user.playingLocationId}},
        {
            $match: {
                clueCode: {
                    $not: {
                        $in: user.playedGames,
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
                $expr: {$gt: ["$maxPlayersSameTime", "$nowPlaying"]},
            },
        },
    ]);
    return clues;
}

const approveClueOrLocation = async ({ ctx, text }) => {
    // ctx.deleteMessage().catch((err) => {
    //   console.log(err);
    // });

    const [, user] = text.split("/");
    const [, userId] = user.split("=");
    const player = await getUserByTelegramId(userId);

    // await changeUserScene(ctx,userId, "start");
    if (player.playStatus === playStatuses.goingToLocation) {

        const locationData = await getLocationDataById(player.playingLocationId);
        //start clue
        await updateUserByTelegramId({
            telegramId: userId,
            data: {
                playStatus: "playingClue",
                playingLocationTime: moment().add(locationData.finishTime, "minutes"),
            },
        });
        //todo it shall be in leave GoingLocation
        await ctx.telegram.sendMessage(userId, "Դուք հասել եք նշված վայր");
        // here shall be go to location scene function

        //   await showGameMenu(userId);
    }
    if (player.playStatus === "playingClue") {
        // const store = Mongo({
        //     url: process.env.mongodb,
        //     collection: "sessions",
        // });
        // // const userSession = new Scenes.SceneContextScene(session({store}), userId);
        //
        // const userSession = new Scenes.SceneContextScene(session({store, getSessionKey:()=>`${userId}:${userId}`}), stage);
        //  await userSession.enter('createTeamName');

        //const userSession = new Context();
        try {
            const clue = await getClueById(player.playingClueId);

            await stopPlayingClue(player);
            await ctx.telegram.sendMessage(
                userId,
                `Շնորհավորում եմ դուք հաղթահարեցիք այս առաջադրանքը և վաստակել եք <b>${clue.point}</b> միավոր։`,
                {
                    parse_mode: "HTML",
                }
            );
            //here shall be enter to locationScene
        } catch (e) {
            console.log("error stopping game", e);
        }
    } else if (player.playStatus === playStatuses.playingLevelUp) {
        const playingLocationStep = player.playingLocationSteps.indexOf(player.playingLocationId);
        if (playingLocationStep < player.playingLocationSteps.length - 1) { // <=   ???
            // if playing in last location

            // const nextLocationId = player.playingLocationSteps[playingLocationStep + 1];
            // if(nextLocationId) {
            await stopLocationAndGoToNext(player);
            // await goToNextLocation(player);
            await ctx.telegram.sendMessage(
                userId,
                "Շնորհավորում եմ դուք հաղթահարել եք այս տարածքի խաղերը։\nՀաջորդիվ ուղևորվեք..."
            );

            // locationScene (next scene)

            // }
        } else {

            await finishTheGameUpdateSchema(player);
            await ctx.telegram.sendMessage(
                userId,
                "Շնորհավորում եմ դուք հաղթահարել եք ամբողջ խաղը։"
            );

            //finish the game scene
        }
    }
    // await bot.telegram.sendMessage(userId, 'Դուք ավարտեցիք Խաղը')
    //user enter location scene
    //await showGameMenu(userId);
};

/**
 * @description stop playing clue, if successful is true, then user will get points
 * @param user - user object with all data
 * @param successful - boolean, if true, then user will get points, if false, then user will not get points
 */
const stopPlayingClue = async (user, successful = true) => {
    try {
        // const user = await getUserByTelegramId(playerTelegramId);
        const clue = await getClueById(user.playingClueId);
        if (user.playingClueId) {
            await updateClue(
                { _id: user.playingClueId },
                {
                    $inc: {
                        nowPlaying: -1,
                    },
                }
            );
            // await enter("locationScene");
            // somehow trigger another player to enter to location scene

            return await updateUserByTelegramId({
                telegramId: user.telegramId,
                data: {
                    playingClueId: undefined,
                    playStatus: playStatuses.inLocation,
                    $unset: { playingClueTime: "" },
                    $inc: {
                        locationPoint: successful ? +clue.point : 0,
                        allPoint: successful ? +clue.point : 0,
                    },
                },
            });
        }
    } catch (e) {
        console.error("stopPlayingClueError", e);
    }
};
// const stopPlayingLocation = async (player) => {
//   try {
//     // const player = await getUserByTelegramId(playerTelegramId);
//     // const location = await getLocationDataById(player.playingLocationId);
//     // const nextPlayStatus = location.needToGoBeforeStart ? "goingLocation" : "playingClue";
//
//     if (player.playingClueId) {//we are stopping the game, if we are playing, because we are going to next location
//      await stopPlayingClue(player, false);
//     }
//     return await updateUserByTelegramId({
//       telegramId: player.telegramId,
//       data: {
//         playingLocationId: undefined,
//         $inc: {
//           allPoint: +player.locationPoint, //todo allpoints will added after game finish, not after location finish
//         },
//         locationPoint: 0,
//         playStatus: undefined,//???
//         playingClueId: undefined,
//         $unset: {playingLocationTime: "", playingClueTime: ""},
//       },
//     });
//
//   }catch (e) {
//     console.error('stopLocationAndGoToNextError', e);
//   }
//
// }

const stopLocationOfUser = async (user) => {
    const location = await getLocationDataById(user.playingLocationId);
    const playingLocationStep = user.playingLocationSteps.indexOf(user.playingLocationId);
    const nextPlayStatus = location.needToGoBeforeStart ? playStatuses.goingToLocation : playStatuses.inLocation;
    const nextLocationId = user.playingLocationSteps[playingLocationStep + 1] || null;
    await updateUserByTelegramId({
        telegramId: user.telegramId,
        data: {
            playingLocationId: nextLocationId,
            locationPoint: 0,
            playStatus: nextPlayStatus,
            playingClueId: undefined,
            $unset: {
                playingLocationTime: "",
                playingClueTime: "",
            },
        },
    });
};
const stopLocationAndGoToNext = async (player, successful = true) => {
    // const player = await getUserByTelegramId(playerTelegramId);
    try {
        if (!successful || player.playingClueId) {//todo check the logic
            //we are stopping the game, if we are playing, because we are going to next location
            await stopPlayingClue(player, false);
        }

        const playingLocationStep = player.playingLocationSteps.indexOf(player.playingLocationId);

        if (playingLocationStep < 0) {
            //may be set to 0
            throw new Error("goToNextLocationError: playingLocationStep<0");
        }
        if (playingLocationStep < player.playingLocationSteps.length - 1) {/// meay be <= ??
            await stopLocationOfUser(player);
        } else {
            await finishTheGameUpdateSchema(player);
        }
    } catch (e) {
        console.log("goToNextLocationError", e);
    }
};

/**
 * @description find out next Levelup and change user play status to playingLevelUp
 * @param playerTelegramId - player telegram id
 */
const goToUserNextLevelUpClueUpdateSchema = async (playerTelegramId) => {
    try {
        const player = await getUserByTelegramId(playerTelegramId);
        const levelUpClue = await Clues.findOne({
            clueType: "levelUp",
            locationId: player.playingLocationId,
        });
        await startPlayingClueUpdateSchema(playerTelegramId, levelUpClue);


        return levelUpClue;
        // await updateUserByTelegramId({
        //     telegramId: player.telegramId,
        //     data: {
        //         playStatus: playStatuses.playingLevelUp,
        //         playingClueId: levelUpClue._id,
        //         $unset: {
        //             playingLocationTime: "",
        //             playingClueTime: "",
        //         },
        //     },
        // });
    } catch (e) {
        console.log("goToNextLocationError", e);
    }
};
async function stopLocationAndGoToLevelUp(player, successful = true) {
    try {
        //if (!successful||player.playingClueId) {//we are stopping the game, if we are playing, because we are going to next location
        await stopPlayingClue(player, successful && player.playingClueId);
        //}
        await goToUserNextLevelUpClueUpdateSchema(player.telegramId);
    } catch (e) {
        console.log("goToNextLocationError", e);
    }
}

async function finishTheGameUpdateSchema(player) {
    // player = await stopLocationAndGoToNext(player);
    // await stopLocationOfUser(player);

     await updateUserByTelegramId({
        telegramId: player.telegramId,
        data: {
            $inc: {
                allPoint: +player.locationPoint,
            },
            locationPoint: 0,
            playStatus: playStatuses.finishedGame,
            playingClueId: undefined,
            playingLocationId: undefined,
            $unset: {
                playingLocationTime: "",
                playingClueTime: "",
            },
        },
    });
}
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
            playStatus: playStatuses.inLocation,
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
    const { user, userId } = await ctx.state;
    const timesInfo = await getPlayerGameAndLocationTimes(userId);
    if (user.role === "admin") {
        await bot.telegram.sendMessage(userId, "you are Admin");
        return false;
    }
    const teamNameText = `Սիրելի <b>${user.teamName}</b>`;
    const allPointText =
        !user.locationPoint && !user.allPoint
            ? `դուք դեռ չունեք միավորներ`
            : `դուք ունեք  <b><i>${user.allPoint}</i></b> միավոր`;
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

const goToLevelUp = async (userTelegramId, showGameMenuParam = true) => {
    await bot.telegram.sendMessage(
        userTelegramId,
        `Դուք հավաքեցիք բավականաչափ միավոր <b>Level Up</b> խաղալու համար`,
        {
            parse_mode: "HTML",
        }
    );


    if (gameConfig.choosingLevelUpGame) {
        await updateUserByTelegramId({//todo when start to implement choosing, remove or change this
            telegramId: userTelegramId,
            data: {
                playStatus: playStatuses.playingLevelUp,
            },
        });

        //todo find a way to show game menu for levelups
        showGameMenuParam && (await showGameMenu(userTelegramId));
    } else {
        await goToUserNextLevelUpClueUpdateSchema(userTelegramId);
    }
    return true;
};
const checkUserGameStatus = async (userTelegramId, showGameMenuParam = true) => {
    try {
        const user = await getUserByTelegramId(userTelegramId);
        const currentLocation = await getLocationDataById(user.playingLocationId);

        // const locationData = user.populate("currentLocation");

        // const {currentLocation, currentLocationId} = user;// await user.populate('currentLocation')

        let nextPlayStatus =
            user.locationPoint < currentLocation.finishPoint ? "playingClue" : "playingLevelUp"; //todo: change this becuaus it can be bugged now jus will use lllong time
        const times = await getPlayerGameAndLocationTimes(userTelegramId);
        //todo : motaka xaxin sa petq chi, dra hamar toxum enq kisat
        // if (
        //     times.locationTime <= +process.env.notificationTimeInMinutes &&
        //     user.playStatus === "playingClue"
        // ) {
        //     await updateUserByTelegramId({
        //         telegramId: userTelegramId,
        //         data: {
        //             playStatus: "playingLevelUp",
        //         },
        //     });
        //     await bot.telegram.sendMessage(
        //         userTelegramId,
        //         `ժամանակը ավարտվեց:  Ցավոք, Դուք չհաղթահարեցիք մեր փորձությունները ժամանակում, այսպիսով դուք սկսում եք Level Up փորձությունը քիչ միավորներով`,
        //         {
        //             parse_mode: "HTML",
        //         }
        //     );
        //     showGameMenuParam && (await showGameMenu(userTelegramId));
        //     return false;
        // }
        const playStatus = await user.playStatus;
        if (playStatus === "playingClue" && nextPlayStatus === "playingLevelUp") {
            await goToLevelUp(userTelegramId, showGameMenuParam);
            // await updateUserByTelegramId({
            //     telegramId: userTelegramId,
            //     data: {
            //         playStatus: nextPlayStatus,
            //     },
            // });
            // await bot.telegram.sendMessage(
            //     userTelegramId,
            //     `Դուք հավաքեցիք բավականաչափ միավոր <b>Level Up</b> խաղալու համար`,
            //     {
            //         parse_mode: "HTML",
            //     }
            // );
            // showGameMenuParam && (await showGameMenu(userTelegramId));
            return false;
        }
        if (!user.playStatus) {
        }
        if (user.playStatus === "goingLocation" && !currentLocation.needToGoBeforeStart) {
            await updateUserByTelegramId({
                telegramId: userTelegramId,
                data: {
                    playStatus: "inLocation",
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
    if (user) {
        const gameTime = user.playingClueTime
            ? -1 * moment().diff(user.playingClueTime, "minute")
            : "noTime";
        const locationTime = user.playingLocationTime
            ? -1 * moment().diff(user.playingLocationTime, "minute")
            : "noTime";
        return {
            gameTime,
            locationTime,
        };
    }
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
                await playClueCallbackTelegramHandle({ ctx, text });
                break;
            case "appG":
                await approveClueOrLocation({ ctx, text });
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
        await ctx.reply(`Send your answer to user ${uId}`, {
            //ete aystex poxeq,
            reply_markup: {
                force_reply: true, // Set the `force_reply` property to true to ensure that the user's message is treated as a reply
            },
        });
    } catch (e) {}
};

async function getPlayerInfoText(user) {
    const userTimes = await getPlayerGameAndLocationTimes(user.telegramId);
    const game = user.playingClueId && (await getClueById(user.playingClueId).populate("location"));

    // const userLocation = await getLocationDataById(user.playingLocationId);
    //todo: show map instead of google location lat, long
    return `
<b>code</b>: <i>${user.code}</i>

<b>Team Name</b>: <i>${user.teamName}</i>
<b>Team location point</b>: <i>${user.locationPoint}</i>
<b>Team all point</b>: <i>${user.allPoint}</i>
<b>Team playing status</b>: <i>${user.playStatus}</i>
<b>game</b>: <i>${(game && game.name) || "doesn't exist"}</i>
<b>Game remaining time</b>: <i>${userTimes.gameTime}</i>
<b>Game Location Name</b>: <i>${(game && game.location?.name) || "doesn't exist"}</i>
<b>Game Google Location</b>: <i>${(game && game.locationFromGoogle) || "doesn't exist"}</i>

          `;
}

const cancelGameTimeout = async ({ player, ctx }) => {
    await updateUserByTelegramId({
        telegramId: player.telegramId,
        data: {
            playingClueId: undefined,
            $unset: { playingClueTime: "" },
        },
    });
    await ctx.telegram.sendMessage(
        player.telegramId,
        `Ձեր Խաղը չեղարկվել է, ժամանակի ավարտի պատճառով`,
        { parse_mode: "HTML" }
    );
    await showGameMenu(player.telegramId);
};
module.exports = {
    getPlayerGameAndLocationTimes,
    checkUserGameStatus,
    showGameMenu,
    editTeamName,
    gameTo,
    showInfo,
    sendWelcomeMessage,
    getPlayerInfoText,
    onMessageTo,
    cancelGameTimeout,
    stopPlayingClue,
    stopLocationAndGoToNext,
    stopLocationAndGoToLevelUp,
    goToLevelUp,
    goToUserNextLevelUpClueUpdateSchema,
    startPlayClue
};
