const { Scenes } = require("telegraf");
const {
    getUserByTelegramId,
    getUserByVerificationCode,
    setUserPlayStatus,
} = require("../../api/user/user");
const Users = require("../../api/user/user.schema");
const { showGameMenu } = require("../game");
const { message } = require("telegraf/filters");
const { resetUserSession } = require("../utils");
const {texts} = require("../../docs/constants");

const startGame = new Scenes.BaseScene("startGame");
startGame.enter(async (ctx) => {
    // await resetUserSession(ctx);
    return ctx.replyWithHTML(texts.startGameText);
});
startGame.leave(async (ctx) => {
    if (ctx.session.user?.role === "admin") {
        await ctx.reply("Ադմին ես");
        return ctx.scene.enter("adminScene");
    }
    // await ctx.reply("gnnacinq hajrd pul");
});

startGame.on(message("text"), async (ctx, next) => {
    if (ctx.message.text.startsWith("/")) {
        return next();
    }
    const userTelegramId = ctx.from.id;
    let user = await getUserByTelegramId(userTelegramId);
    if (!user) {
        const userWithSameVerificationCode = await getUserByVerificationCode(ctx.message.text);
        if (userWithSameVerificationCode) {
            if (userWithSameVerificationCode.telegramId) {
                await ctx.reply("Այս կոդը արդեն ակտիվացրած է");
                return false;
            }

            await Users.updateOne({ verificationCode: ctx.message.text }, { telegramId: ctx.from.id });
            user = await getUserByTelegramId(userTelegramId);
            ctx.session.user = user;
            if (!user.teamName) {
                return ctx.scene.enter("createTeamName");
            } else {
                await ctx.reply(texts.teamNameSuccess);
                await showGameMenu(user.telegramId);
                // await enter("goingToLocationScene");
                return ctx.scene.enter("goingToLocationScene");
                // return next(); ///???
            }
        } else {
            ctx.session.sxalcode = ctx.session.sxalcode ? ctx.session.sxalcode + 1 : 1;
            ctx.state.sxalcode = ctx.state.sxalcode ? ctx.state.sxalcode + 1 : 1;
            return await ctx.reply("Ձեր թիմի կոդը սխալ է, խնդրում ենք ներմուծել ճիշտ կոդը։");
            //next();
            // await leave("startGame")
            // return  ctx.scene.enter("location");
            //return next();
        }
    } else {
        await ctx.reply(texts.teamNameSuccess);
        //await showGameMenu(user.telegramId);
        // ctx.scene.leave();
        ctx.session.user = user;
        return ctx.scene.enter("goingToLocationScene");
        // return next(); ///???
    }
    return false;
});

module.exports = startGame;
