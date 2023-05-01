const {Scenes} = require("telegraf");
const {resetUserSession} = require("../utils");
const resetScene = new Scenes.BaseScene("resetScene");

resetScene.enter(async (ctx) => {
    await ctx.reply("resetScene");
    ctx.session.user = null;

    await    resetUserSession(ctx)
    return await ctx.scene.enter("startGame");

});

module.exports = resetScene;