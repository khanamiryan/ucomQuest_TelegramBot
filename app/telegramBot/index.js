const { Telegraf, Markup, session, Scenes, Context} = require("telegraf");
const schedule = require("node-schedule");
const {bot, store, ctxObj} = require("../bot");

const { showGameMenu, gameTo, showInfo, onMessageTo } = require("./game");
const normalizeScene = require("./normalizeScene");
const { menuMiddleware: admin, adminPage, showAdminInfo } = require("./admin");
const {
  onText,
  onPhoto,
  onVideo,
  actionAnswerToMessage,
  onContact,
  onLocation,
  onFile,
  onlyForward,
  showHelpInfo,
} = require("./playerOnData");
const { scheduleFunction } = require("./schedule");


const { adminScene } = require("./adminScene");

const {getUserById, getUserByTelegramId} = require("../api/user/user");
const stage = require("./stage");
const startGame = require("./scenes/startGameScene");
const Users = require("../api/user/user.schema");
const {playStatuses, texts} = require("../docs/constants");

const {enter} = Scenes.Stage;

bot.use(session({ store }));
//  bot.use(session({ store, getSessionKey: () => "318710072:318710072" }));



// bot.use(async (ctx, next) => {
//   console.log("ctx message", ctx);
//   next();
// });
// bot.hears("hey", (ctx) => {
//   console.log("hey",ctx)
//   const b = new Context("318710072", ctx.update, ctx.telegram);
//
//   b.use(stage.middleware());
//
//   enter("startGame");
// });


// adminScene.use(async (ctx, next) => {
//   const customSession = session({ store , getSessionKey: () => "318710072:318710072"});
//
//   const stage = new Scenes.Stage([
//       startGame,
//     createTeamName,
//     locationScene,
//     adminScene,
//     clueScene,
//     levelUpScene,
//     finishGameScene,
//     goingToLocationScene,
//     resetScene], {defaultSession: customSession});
//     // const customCtx = new SceneContextScene(ctx.update, ctx.telegram, customSession, ctx.state);
//   stage.use(customSession());
//
//
// });

bot.use(async (ctx, next) => {
  let user = ctx?.session?.user;
  const telegramId = ctx.from.id||user.telegramId;
  user = await getUserByTelegramId(telegramId);
    if (user) {
      ctx.state.role = user.role;
      if(user.role !== 'admin') {
        const userAdmin  = await getUserById(user.adminId);//todo add checking
        ctx.state.chatTo = userAdmin.telegramId;
        ctx.state.playingLocationId = user.playingLocationId || user.playingLocationSteps[0] || undefined;
        ctx.state.playingClueId = user.playingClueId || undefined;
        ctx.state.teamName = user.teamName || '';
      }else {//if admin
        ctx.state.teamName = user.teamName || 'adminTeam';
        ctx.state.chatTo = user.chatTo||"";
      }

      ctx.state.userId = user.telegramId || '';
      ctx.state.userData_Id = user._id || '';
      ctx.state.user = user || {};
      ctx.session.user = user;

    }
    // for a time. we save all ctx in ctxObj
    ctxObj[ctx.from.id] = ctx;

    return next();
});

stage.on("leave", (ctx) => {
  console.log("leave", ctx.scene.state);
});
stage.on("enter", (ctx) => {
  console.log("enter", ctx.scene.state);
});


stage.use(async (ctx, next) => {
     await normalizeScene(ctx);
     return next();
});
bot.use(async (ctx, next)=>{
  const user = ctx.session?.user;
  if (user?.role === "player") {
  // await ctx.telegram.setMyCommands([
  //     { command: "/info", description: "Ինֆորմացիա այս պահի մասին" },
  //     { command: "/help", description: "Օգնություն" },
  //     { command: "/game", description: "Խաղերի ցանկը" },
  //   ]);
  } else if (user?.role === "admin") {

  }
    return next();
});

bot.use(stage.middleware());


bot.command("start", async (ctx) => {
  if (!ctx.session?.user?.role) {
    return ctx.scene.enter("startGame");
    // return sendWelcomeMessage(ctx);
  }
}); // open Games Men


bot.on("polling_error", (error) => {
  console.log("polling error", error);
});

bot.command("location", (ctx) => {
  //todo: hayeren
  ctx.reply("Send me your location please", {
    reply_markup: {
      keyboard: [[{ text: "send location", request_location: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});
bot.on('callback_query', async (ctx) => {
  // Using context shortcut
  await ctx.answerCbQuery();
});
bot.on("contact", async (ctx) => onContact(ctx));
bot.on("location", async (ctx) => onLocation(ctx));

bot.use(admin.middleware());

bot.on('callback_query', async (ctx) => {
  // Using context shortcut
  await ctx.answerCbQuery();
});
async function sendMessagesToAllPlayers(users, message) {
  users.forEach(async (user) => {
    await bot.telegram.sendMessage(user.telegramId, message);
  });
  return;
}
// bot.command("test", async (ctx) => {
//   const user = ctx.session?.user;
//
// })
bot.command("admin", async (ctx) => adminPage(ctx));
// bot.command('name', async ctx => editTeamName(ctx))
bot.command("game", async (ctx) => showGameMenu(ctx.state.userId)); // open Games Menu
// bot.command('start', async ctx => sendWelcomeMessage(ctx)) // open Games Menu
bot.command("points", async (ctx) => showInfo(ctx)); // open Games Menu
bot.command("info", async (ctx) => showInfo(ctx)); // open Games Menu
bot.command("help", async (ctx) => {
  if (ctx.state.role === "admin") return showAdminInfo(ctx);
  //else if(ctx.state.role==='player')
  return showHelpInfo(ctx);
}); // open Games Menu

bot.command("reset", enter("resetScene"));



adminScene.action(/^gTo/, async (ctx) => gameTo(ctx)); // gameTo
adminScene.action(/^oneMessageTo/, async (ctx) => onMessageTo(ctx)); // oneMessageT);
bot.on("text", async (ctx) => onText(ctx));
bot.on("photo", async (ctx) => onPhoto(ctx));
bot.on("video", async (ctx) => onVideo(ctx));
bot.on("document", (ctx) => onFile(ctx));
bot.on("message", (ctx) => onlyForward(ctx));

bot.action(/^answerToMessage/, async (ctx) => actionAnswerToMessage(ctx));

// bot.action(/^oneanswerToMessage/, async (ctx) => actionOneanswerToMessage(ctx))
adminScene.action("back", async (ctx) => adminPage(ctx));


bot.use(async (ctx, next) => {
  if (ctx.callbackQuery && "data" in ctx.callbackQuery) {
    console.log(
        "another callbackQuery happened",
        ctx.callbackQuery.data.length,
        ctx.callbackQuery.data
    );
  }
  return next();
});

schedule.scheduleJob("* * * * *", () => {
  // schedule.scheduleJob('*/10 * * * * *', () => {
  scheduleFunction(bot).then();
});

module.exports = bot;
