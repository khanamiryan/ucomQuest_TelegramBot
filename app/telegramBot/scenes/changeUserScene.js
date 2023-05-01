const {ServerSession} = require("mongodb");
const {Telegraf, SessionStore} = require("telegraf");
const {Mongo} = require("@telegraf/session/mongodb");


const changeUserScene = async  (ctx,userId, sceneName) =>{
    // Get the chat ID of the user
    const chatId = await ctx.telegram.getChat(userId).then(chat => chat.id);

    // Send a message to the user to trigger the callback function
    await ctx.telegram.sendMessage(chatId, 'Changing scene...');

    // Create a new session for the user
    // const store = new Map()
    const store = Mongo({
        url: process.env.mongodb,
        collection: "sessions",
    });
    //  const session = new ServerSession(store, { userId })
    // session.user = { id: userId };
    // session.current = sceneName;
    // console.log(ctx.session.get("123"))
    // const store = Mongo({
    //     url: process.env.mongodb,
    //     collection: "sessions",
    // });

    // Set the user's session data in the Redis store
    // await sessionStore.saveSession(userId, session);
}

module.exports = changeUserScene;