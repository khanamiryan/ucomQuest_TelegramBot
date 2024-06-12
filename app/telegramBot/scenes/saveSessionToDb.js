
const { store} = require("../../bot");


function defaultGetSessionKey(ctx){
    const fromId = ctx.from?.id
    const chatId = ctx.chat?.id
    if (fromId == null || chatId == null) return undefined
    return `${fromId}:${chatId}`
}
const saveSessionToDb = async  (ctx, userId) =>{

    await store.set(`${userId}:${userId}`, ctx.session );

}

module.exports = {saveSessionToDb};