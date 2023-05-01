
const Users = require("../api/user/user.schema");
const { initUserSession, gameConfig} = require("../docs/constants");
const { stopPlayingClue, goToUserNextLevelUpClueUpdateSchema, showGameMenu} = require("./game");
const {getLocationDataById} = require("../api/location/location");



const latLongRegex = new RegExp(/^((\-?|\+?)?\d+(\.\d+)?),\s*((\-?|\+?)?\d+(\.\d+)?)$/, "gi"); //gi;

async function resetUserSession(ctx) {
    ctx.session.user?.playingClueId && (await stopPlayingClue(ctx.session.user.playingClueId, false));
    // const user = await getUserByTelegramId(ctx.from.id);

    await Users.updateOne({ telegramId: ctx.from.id }, { $set: initUserSession });

    ctx.session.user = undefined;
}






module.exports = {
    resetUserSession,
    latLongRegex
};