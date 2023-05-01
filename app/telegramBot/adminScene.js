const {Scenes} = require("telegraf");
const {getUserInfo, updateUserByTelegramId, getUserByTelegramId, getUserByCode} = require("../api/user/user");
const Users = require("../api/user/user.schema");
const {showGameMenu, checkUserGameStatus, getPlayerInfoText} = require("./game");
const {onText, onPhoto, showHelpInfo} = require("./playerOnData");
const {message} = require("telegraf/filters");
const {showAdminInfo} = require("./admin");

const adminCommands = {
    stop: 'chatting is stop',
    player: 'playerInfo',
    point: 'added point to player',
    locationpoint: 'add Location Point',
    cancelgame: 'player Games is canceled',
    name: 'team new Name',
    removeplayerinfo: 'remove Player Info, for change user'
}


const adminScene = new Scenes.BaseScene("adminScene");
adminScene.enter(ctx => ctx.reply("Բարի գալուստ այս խաղ duq admin eq"));



adminScene.on("message", async (ctx, next) => {
    const [getCode, text, command] = ctx.message && ctx.message.text ? ctx.message.text.split(':') : []
    const code = getCode && getCode.trim().toLocaleLowerCase();

    if (code && adminCommands[code]) {
        const [player] = await getUserInfo((text || '').trim())
        if(code==="stop"){//stop chatting with current player
            await stopChatting({user, ctx})
        }else
        if (player && player.telegramId) {
            switch (code) {
                case 'cancelgame':
                    await cancelGame({player, ctx})
                    break
                case 'point':
                    await addPoint({player, ctx, command})
                    break
                case 'locationpoint':
                    await addLocationPoint({player, ctx, command})
                    break
                case 'removeplayerinfo':
                    await removePlayerInfo({player, ctx})
                    break;
                case 'name':
                    await updateName({player, ctx, command})
                    break
                // case 'stop':
                //   await stopChatting({user, ctx})
                //   break
                case 'player':
                    await playerInfoForAdmin({player, ctx})
                    break
            }
        } else {
            ctx.reply('user not found')
        }
    }
    return next();
})

// adminScene.text("non", async (ctx, next) => {
//     return onText(ctx);
// })


// adminScene.command("help", async (ctx) => {
//     if (ctx.state.role === "admin") return showAdminInfo(ctx);
//     //else if(ctx.state.role==='player')
//     return showHelpInfo(ctx);
// }); // open Games Menu)

adminScene.on(message("text"), async (ctx, next) => {
    if (ctx.message.text.startsWith('/')) {
        return next();
    }
     return onAdminText(ctx);

});
adminScene.on(message('photo'), async (ctx, next) => {
    return onPhoto(ctx);
});

const stopChatting = async ({user, ctx}) => {
    if(!user.chatTo){//admin have chatto
        await ctx.reply('You are not chatting with anyone');
        return;
    }
    await updateUserByTelegramId({
        telegramId: user.telegramId,
        data: {
            chatTo: null
        }
    });
    await ctx.reply('Chatting is stop')
}

const removePlayerInfo = async ({player, ctx}) => {
    await Users.updateOne({telegramId: player.telegramId}, { $unset: { telegramId: ""} });
    await ctx.telegram.sendMessage(player.telegramId, `Դուք հեռացված եք խաղից`, {parse_mode: 'HTML'})
    await ctx.reply(`${player.teamName} info was removed`, {parse_mode: 'HTML'})
}
const cancelGame = async ({player, ctx}) => {
    await updateUserByTelegramId({
        telegramId: player.telegramId,
        data: {
            playingClueId: undefined,
            $unset: {playingClueTime: ""},
        }
    })
    await ctx.reply(
        `<b>Game canceled</b>
<b>Team Name</b>: <i>${player.teamName}</i>`, {parse_mode: 'HTML'})
    await ctx.telegram.sendMessage(player.telegramId, `Ձեր Խաղը չեղարկվել է`, {parse_mode: 'HTML'})
    await showGameMenu(player.telegramId)
    await playerInfoForAdmin({player, ctx})
}

const updateName = async ({player, ctx, command}) => {
    await updateUserByTelegramId({
        telegramId: player.telegramId,
        data: {
            teamName: command,
        }
    })
    await ctx.reply(
        `<b>Team name is edited</b>
<i>${command}</i>`, {parse_mode: 'HTML'})
    await ctx.telegram.sendMessage(player.telegramId, `Ձեր թիմի անունն է՝ <b>${command}</b>`, {parse_mode: 'HTML'})
}
const addPoint = async ({player, command, ctx}) => {
    await updateUserByTelegramId({
        telegramId: player.telegramId,
        data: {
            $inc: {
                allPoint: command
            },
        }
    })
    await ctx.reply(
        `<b>Point added</b>
<b>Team Name</b>: <i>${player.teamName}</i>
<b>Point</b>: <i>${command}</i>`, {parse_mode: 'HTML'})
    if (command > 0) {
        await ctx.telegram.sendMessage(player.telegramId, `Ձեր թիմին ավելացվեց <b>${command}</b> միավոր`, {parse_mode: 'HTML'})
    } else {
        await ctx.telegram.sendMessage(player.telegramId, `Ձեր թիմից պակասեցվեց <b>${command}</b> միավոր`, {parse_mode: 'HTML'})
    }
    await playerInfoForAdmin({player, ctx})
    await checkUserGameStatus(player.telegramId)
}
const addLocationPoint = async ({player, command, ctx}) => {
    await updateUserByTelegramId({
        telegramId: player.telegramId,
        data: {
            $inc: {
                locationPoint: command,
                allPoint: command
            },
        }
    })
    await ctx.reply(
        `<b>Location Point added</b>
<b>Team Name</b>: <i>${player.teamName}</i>
<b>Point</b>: <i>${command}</i>`, {parse_mode: 'HTML'})
    if (command > 0) {
        await ctx.telegram.sendMessage(player.telegramId, `Ձեր թիմին ավելացվեց <b>${command}</b> միավոր`, {parse_mode: 'HTML'})
    } else {
        await ctx.telegram.sendMessage(player.telegramId, `Ձեր թիմից պակասեցվեց <b>${command}</b> միավոր`, {parse_mode: 'HTML'})
    }
    await playerInfoForAdmin({player, ctx})
    await checkUserGameStatus(player.telegramId)
}

const playerInfoForAdmin = async ({player, ctx}) => {
    if (player && player._id) {
        const user = await getUserByTelegramId(player.telegramId)
        const userInfoText = await getPlayerInfoText(user);
        await ctx.reply(userInfoText, {
            parse_mode: 'html'
        })
        //todo: playingClueData?????
        if (user.playingClueData && user.playingClueData.locationFromGoogle) {
            await ctx.replyWithLocation(...user.playingClueData.locationFromGoogle.split(', '))
        }
    } else {
        await ctx.reply(`this "<b>${text.trim()}</b>" player not found`, {parse_mode: 'HTML'})
    }
}


async function onAdminText(ctx){
    try {
        if (ctx.message.reply_to_message) {
            if (ctx.message.reply_to_message.text.startsWith("Send your answer to user ")) {
                const userId = ctx.message.reply_to_message.text.replace("Send your answer to user ", "")
                await ctx.telegram.sendMessage(userId, `Admin: ${ctx.message.text}`);
                return;
            }
            console.log(ctx)
        }

        let text, user, code;
        if(ctx.state.chatTo && ctx.message.text){
            text = ctx.message.text;
            user = await getUserByTelegramId(ctx.state.chatTo);
        }else{
            [code, text] = ctx.message && ctx.message.text.split(':')
            user = code ? await getUserByCode(code) : null;
        }
        if (user && text) {
            await ctx.telegram.sendMessage(user.telegramId, `Ադմին։ <b><i>${text}</i></b>`, {
                parse_mode: 'html'
            });
        }else{
            await ctx.reply("Ադմին, դու ինչ որ բան սխալ ես գրել, այս նամակը չի ուղարկվել ոչ մի մասնակիցին");
        }

    } catch (e) {
        console.log(e)
    }

}
module.exports = {
    adminScene
}