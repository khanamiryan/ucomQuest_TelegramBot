const { Scenes } = require("telegraf");

const {
    gameTo,
    showGameMenu,
    goToUserNextLevelUpClueUpdateSchema,
    useLocationSceneMiddleware,
} = require("../game");

const { getLocationDataById } = require("../../api/location/location");
const { setUserPlayStatus } = require("../../api/user/user");
const { playStatuses, gameConfig } = require("../../docs/constants");

// const {enterToLocationScene} = require("../scenes");

const locationScene = new Scenes.BaseScene("locationScene");

//todo use this
function checkUserHavePointForLevelUp(user) {
    //todo
    return user.locationPoint >= user.currentLocation.finishPoint;
}

locationScene.enter(async (ctx) => {
    // await ctx.reply("enter locationScene");
    const userId = ctx.session.user._id;
    const userTelegramId = ctx.session.user.telegramId;
    ctx.session.user = await setUserPlayStatus(playStatuses.inLocation, userId);

    await useLocationSceneMiddleware(ctx);
    //if first time entering

    await showGameMenu(ctx.session.user.telegramId);
    // next();
});
locationScene.use(async (ctx, next) => {
    await useLocationSceneMiddleware(ctx, next);
    return next();
});

locationScene.leave((ctx) => {
    ctx.session.locationData = null;
    // ctx.session.locationDescriptionShown = false;
});

// locationScene.on("message", async (ctx, next) => {
//     ctx.reply("Մուտքագրեք ճիշտ պատասխանը");
// });
// locationScene.on("text", async (ctx, next) => {
//     console.log("locationScene text");
//
// })
locationScene.action(/^gTo/, async (ctx) => {
    return gameTo(ctx);
}); // gameTo
module.exports = locationScene;
