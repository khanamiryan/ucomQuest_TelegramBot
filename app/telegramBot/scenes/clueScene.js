const {Scenes} = require("telegraf");
const {setUserPlayStatus, getUserByTelegramId} = require("../../api/user/user");
const {playStatuses} = require("../../docs/constants");
const {getClueById} = require("../../api/clue/clue");
const {getPlayerGameAndLocationTimes, startPlayClue} = require("../game");


const clueScene = new Scenes.BaseScene("clueScene");
clueScene.enter(async (ctx) => {

    const updatedUser = await setUserPlayStatus(playStatuses.playingClue, ctx.session.user._id);
    ctx.session.user  = updatedUser;
    const currentClue = ctx.session.currentClueData;
    // await ctx.reply("Բարի գալուստ այս խաղ clue scene");
    const user = await startPlayClue(ctx, currentClue._id);
    ctx.session.user = user;
//may be need to show firs description here??



});
 clueScene.command("game", async (ctx) => {
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
            message += `Դուք դեռ չեք սկսել ոչ մի առաջադրանք\n`;
            await ctx?.scene.enter("locationScene");
     }

     await ctx.telegram.sendMessage(
         userTelegramId,
         message,
         {
             parse_mode: "HTML",
         }
     );

 });
clueScene.leave((ctx) => {
    ctx.session.currentClueData = null;
    // ctx.reply("paka  clue scene");
    //remove user from clue
    //add clue to user
    //same for levelup
});

module.exports = clueScene;