const Users = require("../api/user/user.schema");
const {
    getUserByTelegramId,
    updateUserByTelegramId,
    getUserByVerificationCode,
    getUserInfo,
    getUserById,
} = require("../api/user/user");
const {
    showGameMenu,
    checkUserGameStatus,
    getPlayerGameAndLocationTimes,
    getPlayerInfoText,
} = require("./game");
const { getClueById } = require("../api/clue/clue");
const { getLocationDataById } = require("../api/location/location");
const { Scenes } = require("telegraf");
const { playStatuses } = require("../docs/constants");

const adminCommands = {
    stop: "chatting is stop",
    player: "playerInfo",
    point: "added point to player",
    locationpoint: "add Location Point",
    cancelgame: "player Games is canceled",
    name: "team new Name",
    removeplayerinfo: "remove Player Info, for change user",
};
const { enter, leave } = Scenes.Stage;

const interceptor = async (ctx, next) => {
    try {
        const userTelegramId = ctx.from.id;
        let user = ctx.session?.user; //await getUserByTelegramId(userTelegramId);
        const currentScene = ctx.scene.current.id;
        if (!user) {
            //  return  ctx.scene.enter('startGame');
            await ctx.reply("interceptor startgame scene deprecated");
            // return next();
            // if (ctx.message && ctx.message.text === '/start') {
            //   return next()
            // }
            // const userWithSameVerificationCode = await getUserByVerificationCode(ctx.message.text)
            // if (userWithSameVerificationCode) {
            //
            //   if (userWithSameVerificationCode.telegramId) {
            //     await ctx.reply('Այս կոդը արդեն ակտիվացրած է')
            //     return false
            //   }
            //   // todo: findOneAndUpdate
            //   await Users.updateOne({ verificationCode: ctx.message.text }, {telegramId: ctx.from.id})
            //   user = await getUserByTelegramId(userTelegramId)
            //   if (!user.teamName) {
            //     await ctx.reply(`Շնորհավորում եմ Ձեզ: Դուք խաղի մեջ եք:\nԱյժմ գրեք Ձեր թիմի անունը, որպեսզի շարունակենք մեր խաղը։`)
            //     return false
            //   } else {
            //       await ctx.reply(`Շնորհավորում եմ Ձեզ: Դուք խաղի մեջ եք:\nԱյժմ կարող եք սկսել խաղը։`)
            //     await showGameMenu(user.telegramId)
            //   }
            // } else {
            //   await ctx.reply('Ձեր թիմի կոդը սխալ է, խնդրում ենք ներմուծել ճիշտ կոդը։')
            //   return false
            // }
        }
        // if (user.updatingTeamName && ctx.message && ctx.message.text) {
        //   await updateUserByTelegramId({telegramId: ctx.state.user.telegramId, data: {
        //       updatingTeamName: false
        //     }})
        // }

        // ctx.state.role = user.role;
        // if(user.role !== 'admin') {
        //   const userAdmin  = await getUserById(user.adminId);//todo add checking
        //   ctx.state.chatTo = userAdmin.telegramId;
        //   ctx.state.playingLocationId = user.playingLocationId || user.playingLocationSteps[0] || undefined;
        //   ctx.state.playingClueId = user.playingClueId || undefined;
        //   ctx.state.teamName = user.teamName || '';
        // }else {//if admin
        //   ctx.state.teamName = user.teamName || 'adminTeam';
        //   ctx.state.chatTo = user.chatTo||"";
        // }
        // ctx.state.userId = user.telegramId || '';
        // ctx.state.userData_Id = user._id || '';
        //
        // ctx.state.user = user || {};
        // set team name if not exist
        // if (!user.teamName) {
        //   await Users.updateOne({ telegramId: user.telegramId }, { teamName: ctx.message.text })
        //   ctx.state.teamName = ctx.message.text
        //   if (user.role === 'player') {
        //
        //     const location = await getLocationDataById(user.playingLocationId);
        //     if(location.needToGoBeforeStart) {
        //       await ctx.reply(`Սիրելի <b>${ctx.message.text}</b> թիմի անդամներ խնդրում ենք ուղարկել նկար Ձեր թիմից, որպեսզի սկսեք խաղը`, {parse_mode: 'HTML'})
        //     }
        //       await showGameMenu(user.telegramId)
        //
        //   } else {
        //     await ctx.reply(`Սիրելի <b>${ctx.message.text}</b>, դու <b>ADMIN</b> ես`, {parse_mode: 'HTML'})
        //   }
        //   return false
        // }
        if (user?.role === "player") {
            ctx.telegram.setMyCommands([
                // {command: '/start', description: 'Start'},
                { command: "/info", description: "Ինֆորմացիա այս պահի մասին" },
                //    {command: '/points', description: 'Միավորները'},
                { command: "/help", description: "Օգնություն" },
                { command: "/game", description: "Խաղերի ցանկը" },
                // {command: '/admin', description: 'Admin'},
                // {command: '/cancel', description: 'Cancel'},
                // {command: '/cancelGame', description: 'Cancel Game'},
                // {command: '/cancelLocation', description: 'Cancel Location'},
                // {command: '/cancelClue', description: 'Cancel Clue'},
                // {command: '/cancelAnswer', description: 'Cancel Answer'},
                // {command: '/cancelQuestion', description: 'Cancel Question'},
                // {command: '/cancelLocationAnswer', description: 'Cancel Location Answer'},
            ]);
        } else if (user?.role === "admin") {
            ctx.telegram.setMyCommands([
                { command: "/start", description: "Start" },
                { command: "/info", description: "Ինֆորմացիա այս պահի մասին" },
                // {command: '/points', description: 'Միավորները'},
                { command: "/help", description: "Օգնություն" },
                { command: "/game", description: "Խաղը" },
                { command: "/admin", description: "Admin" },
                // {command: '/cancel', description: 'Cancel'},
                // {command: '/cancelGame', description: 'Cancel Game'},
                // {command: '/cancelLocation', description: 'Cancel Location'},
                // {command: '/cancelClue', description: 'Cancel Clue'},
                // {command: '/cancelAnswer', description: 'Cancel Answer'},
                // {command: '/cancelQuestion', description: 'Cancel Question'},
                // {command: '/cancelLocationAnswer', description: 'Cancel Location Answer'},
            ]);
        }

        // const [getCode, text, command] = ctx.message && ctx.message.text ? ctx.message.text.split(':') : []
        // const code = getCode && getCode.trim().toLocaleLowerCase();
        // if (code && ctx.state.role === 'admin' && adminCommands[code]) {
        //   const [player] = await getUserInfo((text || '').trim())
        //   if(code==="stop"){//stop chatting with current player
        //     await stopChatting({user, ctx})
        //   }else
        //   if (player && player.telegramId) {
        //     switch (code) {
        //       case 'cancelgame':
        //         await cancelGame({player, ctx})
        //         break
        //       case 'point':
        //         await addPoint({player, ctx, command})
        //         break
        //       case 'locationpoint':
        //         await addLocationPoint({player, ctx, command})
        //         break
        //       case 'removeplayerinfo':
        //         await removePlayerInfo({player, ctx})
        //         break;
        //       case 'name':
        //         await updateName({player, ctx, command})
        //         break
        //       // case 'stop':
        //       //   await stopChatting({user, ctx})
        //       //   break
        //       case 'player':
        //         await playerInfoForAdmin({player, ctx})
        //         break
        //     }
        //   } else {
        //     ctx.reply('user not found')
        //   }
        //   return false
        // }

        // switch (currentScene){
        //       case 'playingClueScene':
        //
        // }

        if (!currentScene) {
            ctx.reply("ԽՆԴԻՐ");
            // if(user.role=== 'admin') {
            //   ctx.scene.enter('adminScene');
            // }else{
            //   ctx.scene.enter('goingToLocationScene',{user},true)
            // }
        } else {
            //return ctx.scene.enter('clueScene',{user},false);
            if (currentScene === "goingToLocationScene") {
                if (user.playStatus === "playingClue") {
                    return ctx.scene.enter("clueScene", { user }, false);
                } else if (user.playStatus === "playingLevelUp") {
                    return ctx.scene.enter("levelUpScene", { user }, false);
                }
            }
            if (currentScene === "locationScene") {
                if (user.playStatus === "playingClue") {
                    return ctx.scene.enter("clueScene", { user }, false);
                }
            }
            if (currentScene === "clueScene") {
                if (user.playStatus === playStatuses.inLocation) {
                    return ctx.scene.enter("locationScene", { user }, false);
                }
                if (user.playStatus === "playingLevelUp") {
                    return ctx.scene.enter("levelUpScene", { user }, false);
                }
            }
            if (currentScene === "levelUpScene" && user.playStatus !== playStatuses.playingLevelUp) {
                if (user.playStatus === "playingClue") {
                    return ctx.scene.enter("clueScene", { user }, false);
                }
                if (user.playStatus === "goingLocation") {
                    return ctx.scene.enter("goingLocation", { user }, false);
                }
                if (user.playStatus === "inLocation") {
                    return ctx.scene.enter("locationScene");
                }
                if(user.playStatus === playStatuses.finishedGame){
                    return ctx.scene.enter("finishGameScene");
                }
                ctx.reply("ԽՆԴԻՐ levelup");
            }
        }
    } catch (e) {
        console.log(e);
    }
};

module.exports = interceptor;
