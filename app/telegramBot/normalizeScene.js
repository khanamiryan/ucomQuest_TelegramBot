
const { playStatuses } = require("../docs/constants");



/**
 * Middleware for normalizing scene
 * because we didn't find yet the way having fully working context and change the scene
 * we change the scene, the context is not changing
 * so we need to set the scene manually, but silently, because we did it when we change the scene
 * @param ctx
 * @returns {Promise<unknown>}
 */

const normalizeScene = async (ctx) => {
    try {
        let user = ctx.session?.user; //await getUserByTelegramId(userTelegramId);
        const currentScene = ctx.scene?.current?.id;

        if (!currentScene) {
            // ctx.reply("ԽՆԴԻՐ");
            // ctx.scene.enter("startGame");
            return ctx.scene.enter("startGame", { user }, true);
        } else {
            if(currentScene === "adminScene"){
                return true;
            }
            //return ctx.scene.enter('clueScene',{user},false);
            if (currentScene === "goingToLocationScene") {
                // if (user.playStatus === playStatuses.inLocation) {
                //     return ctx.scene.enter("locationScene", { user }, true);
                // }
                if (user.playStatus === "playingClue") {
                    return ctx.scene.enter("clueScene", { user }, true);
                } else if (user.playStatus === "playingLevelUp") {
                    return ctx.scene.enter("levelUpScene", { user }, true);
                }
            }
            if (currentScene === "locationScene") {
                if (user.playStatus === "playingClue") {
                    return ctx.scene.enter("clueScene", {  }, true);
                }
            }
            if (currentScene === "clueScene") {
                if (user.playStatus === playStatuses.inLocation) {
                    return ctx.scene.enter("locationScene");
                }
                if (user.playStatus === "playingLevelUp") {
                    return ctx.scene.enter("levelUpScene",  {}, true);
                }
            }
            if (currentScene === "levelUpScene" && user.playStatus !== playStatuses.playingLevelUp) {
                if (user.playStatus === "playingClue") {
                    return ctx.scene.enter("clueScene",{}, true);
                }
                if (user.playStatus === "goingLocation") {
                    return ctx.scene.enter("goingLocation", {}, true);
                }
                if (user.playStatus === "inLocation") {
                    return ctx.scene.enter("locationScene", {}, true);
                }
                if(user.playStatus === playStatuses.finishedGame){
                    return ctx.scene.enter("finishGameScene", {}, true);
                }
                ctx.reply("ԽՆԴԻՐ levelup");
            }
        }
    } catch (e) {
        console.log(e);
    }
};

module.exports = normalizeScene;
