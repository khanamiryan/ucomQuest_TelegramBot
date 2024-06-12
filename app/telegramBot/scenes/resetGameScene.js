const {Scenes} = require("telegraf");
const {resetUserSession} = require("../utils");
const resetScene = new Scenes.BaseScene("resetScene");

resetScene.enter(async (ctx, next) => {


    await ctx.reply("resetScene");
    // ctx.session.user = null;

    await resetUserSession(ctx);

    // ctx.session.user = null;
    await ctx.scene.enter("startGame",{user: null});
    ctx.session.user = undefined;
    ctx.session = {}
    // return next();

});

module.exports = resetScene;