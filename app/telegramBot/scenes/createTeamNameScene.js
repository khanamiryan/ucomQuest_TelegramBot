const {Scenes, Markup} = require("telegraf");
const Users = require("../../api/user/user.schema");

const createTeamName = new Scenes.BaseScene("createTeamName");

createTeamName.use(async (ctx, next) => {
    if (!ctx.session.user) {
        return ctx.scene.enter("startGame");
    }
    await next();
});
createTeamName.enter((ctx) => ctx.reply("timi anun@"));
createTeamName.leave((ctx) => {
    if (ctx.session?.user?.role === 'player') {
ctx.reply("bob")
    } else if (ctx.session?.user?.role === 'admin'){

         ctx.reply(`Սիրելի <b>${ctx.session.user.teamName}</b>, դու <b>ADMIN</b> ես`, {parse_mode: 'HTML'});
    }

});
createTeamName.on("message", async (ctx, next) => {
    const teamName = ctx.message.text;
    ctx.session.promptedTeamName = teamName;
    await ctx.reply(`Համոզվա՞ծ եք, որ ձեր թիմի անունը ${teamName} է`, Markup.inlineKeyboard([
        Markup.button.callback('Այո', 'yes'),
        Markup.button.callback('Ոչ', 'cancel')
    ]));
    //todo
})
createTeamName.action("yes", async (ctx, next) => {
    ctx.deleteMessage();
    ctx.replyWithChatAction("typing")
    const user = ctx.session.user;
    const teamName = ctx.session.promptedTeamName;

    if(teamName&&user){
        await Users.updateOne({ telegramId: user.telegramId }, { teamName: teamName })
            user.teamName = teamName;
            if (user.role === 'player') {
                return ctx.scene.enter("goingToLocationScene");
                //await showGameMenu(user.telegramId)

            } else if (user.role === 'admin'){
                return ctx.scene.enter("adminScene");
            }
            return true;
    }

});
createTeamName.action("cancel", async (ctx, next) => {
    return ctx.reply("Խնդրում եմ կրկին գրեք Ձեր թիմի անունը");
});

module.exports = createTeamName;