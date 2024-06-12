const { Telegraf, Markup, session, Scenes, Stage } = require("telegraf");
const {
    setUserPlayStatus,
} = require("../api/user/user");
const Users = require("../api/user/user.schema");
const {

    startPlayClue, getPlayerGameAndLocationTimes, sendMessagesToMultipleUsers,
} = require("./game");
const { getLocationDataById } = require("../api/location/location");
const { message } = require("telegraf/filters");
const { playStatuses, texts} = require("../docs/constants");
const {getClueById} = require("../api/clue/clue");
const {bot} = require("../bot");



const goingToLocationScene = new Scenes.BaseScene("goingToLocationScene");

goingToLocationScene.enter(async (ctx) => {
    try {
        ctx.session.locationDescriptionShown = false;
        ctx.session.user = await setUserPlayStatus(playStatuses.goingToLocation, ctx.session.user._id);

        if (!ctx.session.user) {
            return ctx.scene.enter("startGame");
        }
        const user = ctx.session.user;
        const location = await getLocationDataById(user.playingLocationId);
        if (!location.needToGoBeforeStart) {
            return ctx.scene.enter("locationScene");
        }

        await ctx.reply(
            `Սիրելի <b>${user.teamName}</b> թիմի անդամներ խնդրում ենք ուղարկել նկար Ձեր թիմից, որպեսզի սկսեք խաղը`,
            { parse_mode: "HTML" }
        );
    } catch (e) {
        console.log(e);
    }
});
// goingToLocationScene.on(message("text"), async (ctx, next) => {
//     next();
// });
goingToLocationScene.hears("goto", async (ctx, next) => {
    return ctx.scene.enter("locationScene");//????
});

goingToLocationScene.leave(async (ctx) => {
    try {
        if(!ctx.session.locationDescriptionShown) {
            const location = await getLocationDataById(ctx.session.user.playingLocationId);
            location?.startDescription && (await ctx.replyWithHTML(location.startDescription));
            ctx.session.locationDescriptionShown = true;
        }
    }catch (e){
        console.log("here",e);
    }
     // await ctx.reply("Դուք հաջողությամբ հասաք նշված վայր։");

});
goingToLocationScene.command("game", async (ctx) => {
    await ctx.reply("Դուք պետք է հասնեք նշված վայր։");
});
goingToLocationScene.on("callback_query", async (ctx) => {
    // Using context shortcut
    return await ctx.answerCbQuery();
});

const levelUpScene = new Scenes.BaseScene("levelUpScene");
// levelUpScene.use(async (ctx, next) => {
//   return next();
// });

// const enterToLevelUp = async (userTelegramId) => {
//     //find the levelup clue by user id
//     //add clue to user
//    // const clueId = findLevelUpClueByUserId(userTelegramId);
//     await goToUserNextLevelUpClueUpdateSchema(userTelegramId);
//
// }
levelUpScene.enter(async (ctx) => {
    ctx.session.user = await setUserPlayStatus(playStatuses.playingLevelUp, ctx.session.user._id);
    // await ctx.reply("Բարի գալուստ այս խաղ levelUpScene scene");
    const currentClue = ctx.session.currentClueData;
    const user = await startPlayClue(ctx, currentClue?._id);
    ctx.session.user = user;

    // if(currentClue.nowPlaying>=currentClue.maxPlayersSameTime){
    //     //find users not in playStatus playingLevelUp
    //     //playingLocationSteps
    //     //find users  in whos playingLocationSteps  is playingLevelUp
    //
    //     //telegramid exists
    //
    //
    //     const allAnotherUsers =  await Users.find({
    //         _id: {$ne: user._id},
    //         playStatus: {$ne: playStatuses.playingLevelUp},
    //         telegramId: {$exists: true},
    //     });
    //
    //     const filteredUsers = allAnotherUsers?.filter(
    //         (u) =>
    //             u.role !== "admin" &&
    //             u.playingLocationSteps[0].toString() ===
    //             user.playingLocationSteps[0].toString()
    //     );
    //     await sendMessagesToMultipleUsers(allAnotherUsers, texts.notWinners);
    //
    // }

    // await enterToLevelUp(ctx.session.user.telegramId);
    //may be need to show firs description here??
    //play Clue levelup (description and all)
});



levelUpScene.command("game", async (ctx, next) => {
    ctx.reply("Այժմ, դուք LevelUp առաջադրանքի մեջ եք");
    // const user = await getUserByTelegramId(userTelegramId);
    const user  = ctx.session.user;
    const userTelegramId = user.telegramId;

    const timesInfo = await getPlayerGameAndLocationTimes(userTelegramId);

    let message = ``;
    const gameData = await getClueById(user.playingClueId);
    if (gameData) {
        message += `Ձեր առաջադրանքի անունն է <b><i>${gameData.name}</i></b>\n`;
        message += `Նկարագրություն\n<b><i>${gameData.fullDescription}</i></b>\n`;
        if (timesInfo.gameTime > 0 && timesInfo.gameTime < 60) {
            message += `Հաղթահարելու համար մնացել է <b><i>${timesInfo.gameTime}</i></b> րոպե\n`;
        }
        //  message += `<b>Տևողությունը ${gameData.playTime} րոպե</b>\n`
    }else{
        message+= `Ձեր առաջադրանքը չի գտնվել, կապնվեք ադմինների հետ\n`;
    }

    await ctx.telegram.sendMessage(
        userTelegramId,
        message,
        {
            parse_mode: "HTML",
        }
    );
    // next();
});
levelUpScene.leave((ctx) => {
    ctx.session.currentClueData = null;
    // ctx.reply("paka գալուստ այս խաղ levelUpScene scene (desc)");
    //remove user from levelup
    //remove location points from user
    //go to next location or finish game
});

const finishGameScene = new Scenes.BaseScene("finishGameScene");
finishGameScene.enter(async (ctx) => {
    try {
        ctx.session.user = await setUserPlayStatus(playStatuses.finishedGame, ctx.session.user._id);
        const user = ctx.session.user;
        // ctx.reply("Ավարտվեց խաղը");
        const userId = ctx.session.user.telegramId;
        // await ctx.telegram.setMyCommands(userId, [{ command: '/help', description: 'Help' }]);



        await ctx.telegram.sendMessage(userId, "Շնորհավորում եմ դուք հաղթահարել եք ամբողջ խաղը։");

        try {
            const allAnotherUsers =  await Users.find({
                _id: {$ne: user._id},
                // playStatus: {$ne: playStatuses.playingLevelUp},
                telegramId: {$exists: true},
            });

            const filteredUsers = allAnotherUsers?.filter(
                (u) =>
                    u.role !== "admin" &&
                    u.playingLocationSteps[0].toString() ===
                    user.playingLocationSteps[0].toString()
            );

            await sendMessagesToMultipleUsers(filteredUsers, texts.notWinners);
        }catch (e){
            console.log(e);
        }
    }
    catch (e) {
        console.log(e);
    }
});

// const enterToLocationScene = async (userTelegramId) => {//this function can also use by admin for user
//     // ctx.session.user  = await setUserPlayStatus(playStatuses.inLocation, userId);
//     //change user session, not admin
//    // await showGameMenu(userTelegramId);
// }

module.exports = {
    levelUpScene,
    finishGameScene,
    goingToLocationScene,
    // enterToLocationScene
};
