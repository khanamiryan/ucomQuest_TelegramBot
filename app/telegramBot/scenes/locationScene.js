const {Scenes} = require("telegraf");

const {gameTo, showGameMenu, goToUserNextLevelUpClueUpdateSchema} = require("../game");

const {getLocationDataById} = require("../../api/location/location");
const {setUserPlayStatus} = require("../../api/user/user");
const {playStatuses, gameConfig} = require("../../docs/constants");
// const {enterToLocationScene} = require("../scenes");


const locationScene = new Scenes.BaseScene("locationScene");

//todo use this
function checkUserHavePointForLevelUp(user) {
    //todo
    return user.locationPoint >= user.currentLocation.finishPoint;
}

locationScene.use(async (ctx, next) => {
    await ctx.reply("use locationScene");
    const userId = ctx.session.user._id;
    const userTelegramId = ctx.session.user.telegramId;
    const location = await getLocationDataById(ctx.session.user.playingLocationId);
    ctx.scene.state.location = location;//todo may be will usable

    const userLocationPoint = ctx.session.user.locationPoint;

    //if user have point for level up
    if(userLocationPoint>=location.finishPoint) {
        if (gameConfig.choosingLevelUpGame === false) {
            const levelUpClue = await goToUserNextLevelUpClueUpdateSchema(userTelegramId);
            ctx.session.currentClueData = levelUpClue;
            return ctx.scene.enter("levelUpScene");
        }
        // await goToUserNextLevelUpClueUpdateSchema(ctx.session.user.telegramId);
        // return ctx.scene.enter("levelUpScene");
        //todo may be show level up menu need to be separate?
        //todo may be here need return
        await showGameMenu(userTelegramId);
    }
    return next();

});

locationScene.enter(async (ctx) => {
    await ctx.reply("enter locationScene");
    const userId = ctx.session.user._id;
    const userTelegramId =ctx.session.user.telegramId;
    ctx.session.user  = await setUserPlayStatus(playStatuses.inLocation, userId);
    // await enterToLocationScene(userTelegramId);
    // if(checkUserHavePointForLevelUp(ctx.session.user)){
    //     const levelUpForUser = "";
    //     return ctx.scene.enter("levelUpScene", {levelUpForUser});
    // }

    // const userCurrentLocation = getCurrentLocation(ctx.session.user);

    //if(user.locationPoint>userCurrentLocation.point)
    //return ctx.scene.enterScene("levelUpScene");

    await showGameMenu(ctx.session.user.telegramId);
    // next();
});



locationScene.leave((ctx) => ctx.reply("paka գալուստ այս խաղ location scene"));

// locationScene.on("message", async (ctx, next) => {
//     ctx.reply("Մուտքագրեք ճիշտ պատասխանը");
// });
// locationScene.on("text", async (ctx, next) => {
//     console.log("locationScene text");
//
// })
locationScene.action(/^gTo/, async (ctx) => {
    return gameTo(ctx)
}); // gameTo
module.exports = locationScene;
