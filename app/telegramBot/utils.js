
const {getUserByTelegramId} = require("../api/user/user");
const Users = require("../api/user/user.schema");
const {initUserSession} = require("../docs/constants");
const latLongRegex =new RegExp(/^((\-?|\+?)?\d+(\.\d+)?),\s*((\-?|\+?)?\d+(\.\d+)?)$/, 'gi') //gi;


async function resetUserSession(ctx) {
    ctx.session.user = undefined;
    const user = await getUserByTelegramId(ctx.from.id);
    // if (user) {
    await Users.updateOne({ telegramId: ctx.from.id }, { $set: initUserSession });
    // }
}

module.exports = {
    resetUserSession,
    latLongRegex
}