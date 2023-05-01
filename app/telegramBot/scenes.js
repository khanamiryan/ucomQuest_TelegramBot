const { Telegraf, Markup, session, Scenes, Stage } = require("telegraf");
const { getUserByVerificationCode, getUserByTelegramId, getUserInfo, setUserPlayStatus} = require("../api/user/user");
const Users = require("../api/user/user.schema");
const { showGameMenu, getPlayerInfoText, gameTo, goToUserNextLevelUpClueUpdateSchema, startPlayClue} = require("./game");
const { getLocationDataById } = require("../api/location/location");
const { message } = require("telegraf/filters");
const {playStatuses} = require("../docs/constants");


const { enter, leave } = Scenes.Stage;

// startGame.hears("bob", enter("createTeamName"));

const goingToLocationScene = new Scenes.BaseScene("goingToLocationScene");



goingToLocationScene.enter(async (ctx) => {
    try {
        ctx.session.user  = await setUserPlayStatus(playStatuses.goingToLocation, ctx.session.user._id);

        if (!ctx.session.user) {
            return ctx.scene.enter("startGame");
        }
        const user = ctx.session.user;
        const location = await getLocationDataById(user.playingLocationId);
        if (!location.needToGoBeforeStart) {
            return ctx.scene.enter("locationScene");
        }

        if (location.needToGoBeforeStart) {
            await ctx.reply(
                `Սիրելի <b>${ctx.message.text}</b> թիմի անդամներ խնդրում ենք ուղարկել նկար Ձեր թիմից, որպեսզի սկսեք խաղը`,
                { parse_mode: "HTML" }
            );
        }
    } catch (e) {
        console.log(e);
    }
});
goingToLocationScene.on(message("text"), async (ctx, next) => {
    next();
});
goingToLocationScene.hears("goto", async (ctx, next) => {
    return ctx.scene.enter("locationScene");
});

goingToLocationScene.leave(async (ctx) => {
    return await ctx.reply("paka գալուստ այս խաղ goingToLocationScene scene");
});
goingToLocationScene.command("game", async (ctx) => {
  await ctx.reply("You are not allowed yet, send the picture, that you are there")
})
goingToLocationScene.on('callback_query', async (ctx) => {
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
    ctx.session.user  = await setUserPlayStatus(playStatuses.playingLevelUp, ctx.session.user._id);
    await ctx.reply("Բարի գալուստ այս խաղ levelUpScene scene");
    const currentClue = ctx.session.currentClueData;
    const user = await startPlayClue(ctx, currentClue._id);
    ctx.session.user = user;


    // await enterToLevelUp(ctx.session.user.telegramId);
    //may be need to show firs description here??
    //play Clue levelup (description and all)

});
levelUpScene.command("game", async (ctx, next) => {
   ctx.reply("Այժ, դուք LevelUp առաջադրանքի մեջ եք");
   next();
});
levelUpScene.leave((ctx) => {
    ctx.reply("paka գալուստ այս խաղ levelUpScene scene (desc)");
    //remove user from levelup
    //remove location points from user
    //go to next location or finish game

});

const finishGameScene = new Scenes.BaseScene("finishGameScene");
finishGameScene.enter(async (ctx) => {
    ctx.session.user  = await setUserPlayStatus(playStatuses.finishedGame, ctx.session.user._id);
    ctx.reply("Ավարտվեց խաղը")
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
