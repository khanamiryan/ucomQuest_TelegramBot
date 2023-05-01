const {getUserByCode, updateUserByTelegramId, getUserByTelegramId} = require("../api/user/user");
const {getLocationDataById} = require("../api/location/location");
const {saveFile} = require("../api/file/file");
const {getClueById} = require("../api/clue/clue");
const {getPlayerInfoText} = require("./game");
const {playStatuses} = require("../docs/constants");
const onText = async (ctx) => {
  try {
    // if(ctx.message.reply_to_message){
    //   if(ctx.message.reply_to_message.text.startsWith("Send your answer to user ")) {
    //       const userId = ctx.message.reply_to_message.text.replace("Send your answer to user ", "")
    //       await ctx.telegram.sendMessage(userId, `Admin: ${ctx.message.text}`);
    //       return ;
    //   }
    //       console.log(ctx)
    // }
    const userData = await getUserByTelegramId(ctx.from.id)
    if (userData?.updatingTeamName && ctx.message && ctx.message.text) { //????
      await updateUserByTelegramId({
        telegramId: ctx.state.userId, data: {
          updatingTeamName: false,
          teamName: ctx.message.text
        }
      })
      await ctx.reply(`Ձեր թիմի անունն է <b>${ctx.message.text}</b>`, {
        parse_mode: 'html'
      })
      return false
    }


    if(ctx.state.role === 'admin'){
      // let text, user, code;
      // if(ctx.state.chatTo && ctx.message.text){
      //   text = ctx.message.text;
      //   user = await getUserByTelegramId(ctx.state.chatTo);
      // }else{
      //   [code, text] = ctx.message && ctx.message.text.split(':')
      //   user = code ? await getUserByCode(code) : null;
      // }
      // if (user && text) {
      //   await ctx.telegram.sendMessage(user.telegramId, `Ադմին։ <b><i>${text}</i></b>`, {
      //     parse_mode: 'html'
      //   });
      // }else{
      //   await ctx.reply("Ադմին, դու ինչ որ բան սխալ ես գրել, այս նամակը չի ուղարկվել ոչ մի մասնակիցին");
      // }
    }
    else {
//       const sendToAdmin = await getUserByTelegramId(ctx.state.chatTo);
//
//       const user = await getUserByTelegramId(ctx.from.id);
//       if (
//           user &&
//           ctx.state.role === "player" &&
//           sendToAdmin.role === "admin" &&
//           ctx.state.chatTo &&
//           ctx.message.text
//       ) {
//         const gameButtons = [{ text: "պատասխանել մասնակցին" , callback_data: `oneMessageTo:${user?.telegramId}:${ctx.message.message_id}` }];
//         if (user.playingClueId && user.playStatus === "playingClue") {
//           gameButtons.push(getClueApproveButton(ctx.state.userId, "Ընդունել որպես առաջադրանքի պատասխան"));
//           gameButtons.push(getClueRejectButton(ctx.state.userId, "Մերժել որպես առաջադրանքի պատասխան"));
//         }
//
//         ctx.state.chatTo &&
//         (await ctx.telegram.sendMessage(
//             ctx.state.chatTo,
//             `Հաղորդագրություն մասնակցից։
// <b><i>${ctx.message.text}</i></b>\n\n
// User Info:${await getPlayerInfoText(user)}`,
//             {
//               parse_mode: "html",
//               reply_markup: JSON.stringify({ inline_keyboard: [gameButtons] }),
//             }
//         ));
//       } else {
//         await ctx.reply("Տեղի է ունեցել սխալ, կապնվեք կազմակերպիչների հետ");
//       }


      const sendToAdmin = await getUserByTelegramId(ctx.state.chatTo);

      const user = ctx.session.user;
      const admin = user.adminId;
      const scene = ctx.scene.current;
      const adminTelegramId = ctx.state.chatTo;
      if (
          // user &&
          // ctx.state.role === "player" &&
          // /sendToAdmin.role === "admin" &&
          // ctx.state.chatTo &&
          adminTelegramId &&
          ctx.message.text
      ) {

        const gameButtons = user? [
          getAnswerToPlayerButton(user.telegramId, ctx.message.message_id)
        ]:[];
        // if (user.playingClueId && user.playStatus === "playingClue") {
        if ((scene.id === "goingToLocationScene" || scene.id === "clueScene"|| scene.id==="levelUpScene") ) {//levelup also, and may be change rto playstatus
          gameButtons.push(
              getClueApproveButton(ctx.state.userId, "Ընդունել որպես առաջադրանքի պատասխան")
          );
          gameButtons.push(getClueRejectButton(ctx.state.userId, "Մերժել որպես առաջադրանքի պատասխան"));
        }

        adminTelegramId &&
        (await ctx.telegram.sendMessage(
            adminTelegramId,
            `Հաղորդագրություն մասնակցից։ 
<b><i>${ctx.message.text}</i></b>\n\n
User Info:${await getPlayerInfoText(user)}`,
            {
              parse_mode: "html",
              reply_markup: JSON.stringify({ inline_keyboard: [gameButtons] }),
            }
        ));
        ctx.replyWithChatAction("typing");
      } else {
        await ctx.reply("Տեղի է ունեցել սխալ, կապնվեք կազմակերպիչների հետ");
      }
    }
  } catch (e) {
    console.log(3333, e);
  }
}
const onFile = async (ctx) => {
  try {
    const file = await ctx.telegram.getFileLink(ctx.message.document.file_id)
    const game = await getClueById(ctx.state.playingClueId)
    await saveFile({
      fileName: ctx.message.document.file_name,
      fileId: ctx.message.document.file_id,
      userId: ctx.state.userId,
      userTeamName: ctx.state.user.teamName,
      userCode: ctx.state.user.code,
      fileHref: file.href,
      fileType: 'file',
      gameName: game && game.name,
      gameLocation: game && game.locationFromGoogle,
    })
    if (ctx.stat && ctx.stat.chatTo && ctx.state.role === 'player') {
      await ctx.telegram.sendMessage(ctx.state.chatTo, `
<b>plyerCode</b>: <b>${ctx.state.user.code}</b>
<b>playerTeamName</b>: ${ctx.state.user.teamName}
<i>send you a File</i>`, {
        parse_mode: 'html'
      })
      await ctx.telegram.forwardMessage(ctx.state.chatTo, ctx.state.userId, ctx.message.message_id)
      const userLocation = await getLocationDataById(ctx.state.user.playingLocationId);
      if (game && game._id) {
        const gameButtons = [
          [getClueApproveButton(ctx.state.userId),
            getClueRejectButton(ctx.state.userId)] // rej = reject, gTo = gameTo, uId = userId,
        ];
        await ctx.telegram.sendMessage(ctx.state.chatTo, `GameName: ${game.name}\nLocationName: ${userLocation.name}`, {reply_markup: JSON.stringify({inline_keyboard: gameButtons})})
      }
    } else {
      ctx.state.chatTo && await ctx.telegram.forwardMessage(ctx.state.chatTo, ctx.state.userId, ctx.message.message_id)
    }
  } catch (e) {
    console.log(3333, e);
  }
}
const getClueApproveButton = (userTelegramId, approveText="approve") => {
  return {text: `✅ ${approveText}`, callback_data: `gTo:appG/uId=${userTelegramId}`};
}
const getClueRejectButton = (userTelegramId, rejectText="reject") => {
    return {text: `❌ ${rejectText}`, callback_data: `gTo:rejG/uId=${userTelegramId}`};
}
const getAnswerToPlayerButton = (userTelegramId, messageId, text="Պատասխանել մասնակցին") =>{
  return {
    text,
    callback_data: `oneMessageTo:${userTelegramId}:${messageId}`,
  };
}
const onPhoto = async (ctx) => {
  try {
    const photo = await ctx.telegram.getFileLink(ctx.message.photo.pop().file_id)
    const game = await getClueById(ctx.state.playingClueId)
    await saveFile({
      fileName: `${new Date().getTime()}.jpg`,
      fileId: ctx.message.photo.pop().file_id,
      userId: ctx.state.userId,
      userTeamName: ctx.state.user.teamName,
      userCode: ctx.state.user.code,
      fileHref: photo.href,
      fileType: 'photo',
      gameName: game && game.name,
      gameLocation: game && game.locationFromGoogle,
    })
    if (ctx.state.chatTo && ctx.state.role === 'player') {
      await ctx.telegram.sendMessage(ctx.state.chatTo, `
<b>plyerCode</b>: <b>${ctx.state.user.code}</b>
<b>playerTeamName</b>: ${ctx.state.user.teamName}
<i>send you a photo</i>`, {
        parse_mode: 'html'
      })
      const userLocation = await getLocationDataById(ctx.state.user.playingLocationId);
      await ctx.telegram.sendPhoto(ctx.state.chatTo, ctx.message.photo.pop().file_id);
      const gameButtons = [
        [getAnswerToPlayerButton(ctx.state.userId, ctx.message.message_id),
          getClueApproveButton(ctx.state.userId),
          getClueRejectButton(ctx.state.userId)]
      ];
      if (game && game._id) {
        await ctx.telegram.sendMessage(ctx.state.chatTo, `GameName: ${game.name}\nLocationName: ${userLocation.name}`, {reply_markup: JSON.stringify({inline_keyboard: gameButtons})})
      } else if (ctx.state.user.playStatus === 'goingLocation') {
        const userLocation = await getLocationDataById(ctx.state.user.playingLocationId);
        await ctx.telegram.sendMessage(ctx.state.chatTo, `Going To: ${userLocation.name}`, {reply_markup: JSON.stringify({inline_keyboard: gameButtons})})
      }
    } else {
      ctx.state.chatTo && await ctx.telegram.sendPhoto(ctx.state.chatTo, ctx.message.photo.pop().file_id)
    }
  } catch (e) {
    console.log(3333, e);
  }
}

const onVideo = async (ctx) => {
  try {
    const video = await ctx.telegram.getFileLink(ctx.message.video.file_id)
    const game = await getClueById(ctx.state.playingClueId)
    await saveFile({
      fileName: `${new Date().getTime()}.${ctx.message.video.mime_type.split('/').pop()}`,
      fileId: ctx.message.video.file_id,
      userId: ctx.state.userId,
      userTeamName: ctx.state.user.teamName,
      userCode: ctx.state.user.code,
      fileHref: video.href,
      fileType: 'video',
      gameName: game ? game.name : '',
      gameLocation: game ? game.locationFromGoogle : '',
    })
    if (ctx.state.chatTo && ctx.state.role === 'player') {
      await ctx.telegram.sendMessage(ctx.state.chatTo, `
<b>plyerCode</b>: <b>${ctx.state.user.code}</b>
<b>playerTeamName</b>: ${ctx.state.user.teamName}
<i>send you a Video</i>`, {
        parse_mode: 'html'
      })
      await ctx.telegram.sendVideo(ctx.state.chatTo, ctx.message.video.file_id)
      const userLocation = await getLocationDataById(ctx.state.user.playingLocationId);
      if (game && game._id) {
        const gameButtons = [
          [{text: `✅ approve`, callback_data: `gTo:appG/uId=${ctx.state.userId}`}, // app = approve, gTo = gameTo, uId = userId,
            {text: `❌ reject`, callback_data: `gTo:rejG/uId=${ctx.state.userId}`}] // rej = reject, gTo = gameTo, uId = userId,
        ];
        await ctx.telegram.sendMessage(ctx.state.chatTo, `GameName: ${game.name}\nLocationName: ${userLocation.name}`, {reply_markup: JSON.stringify({inline_keyboard: gameButtons})})
      }
    } else {
      ctx.state.chatTo && await ctx.telegram.sendVideo(ctx.state.chatTo, ctx.message.video.file_id)
    }
  } catch (e) {
    console.log(3333, e);
  }
}
const actionAnswerToMessage = async (ctx) => {
  try {
    const [, userId, userCode] = ctx.update.callback_query.data.split(':')
   const user =  await updateUserByTelegramId({
      telegramId: ctx.from.id,
      data: {
        chatTo: userId//admin chattingo to user
      }
    })
    if (user){
      ctx.editMessageText(`now we chatting with ${userCode}\nteamName: ${user.teamName}`)
    }else{
      ctx.editMessageText(`user not found`);
    }

  } catch (e) {
    console.log(3333, e);
  }
}
const onContact = async (ctx) => {
  try {
    await updateUserByTelegramId({
      telegramId: ctx.update.message.contact.user_id,
      data: {
        phone_number: +ctx.update.message.contact.phone_number,
      }
    })
    ctx.reply(`thank you our admins will contact you, by that number\n${ctx.update.message.contact.phone_number}`)
  } catch (e) {
    console.log(3333, e);
  }
}
const onLocation = async (ctx) => {
  // console.log(123, ctx);
  // await updateUserByTelegramId({
  //   telegramId: ctx.update.message.contact.user_id,
  //   data: {
  //     phone_number: +ctx.update.message.contact.phone_number,
  //   }
  // })

  // sendtoUserAdmin(ctx, `user send you a location`)

  ctx.reply(`thank you`)
}
const onlyForward = async (ctx) => {
  try {
    let data = ctx.message.audio && ctx.message.audio.file_id && await ctx.telegram.getFileLink(ctx.message.audio.file_id)
    const game = await getClueById(ctx.state.playingClueId)
    const file = data || await ctx.telegram.getFileLink(ctx.message.voice.file_id)
    await saveFile({
      fileId: ctx.message && ctx.message.audio && ctx.message.audio.file_id || ctx.message.voice.file_id,
      userId: ctx.state.userId,
      userTeamName: ctx.state.user.teamName,
      userCode: ctx.state.user.code,
      fileHref: file.href || '',
      fileType: 'data',
      gameName: game && game.name,
      gameLocation: game && game.locationFromGoogle,
    })
    ctx.state.chatTo && await ctx.telegram.forwardMessage(ctx.state.chatTo, ctx.state.userId, ctx.message.message_id)
  } catch (e) {
    console.log(e);
  }
}

function showHelpInfo(ctx) {
  ctx.reply(`
<b>Help</b>
/start - start game
/help - show help info
/stop - stop game
/next - next clue
/prev - prev clue
`, {parse_mode: 'html'})

}
module.exports = {
  onLocation,
  onContact,
  actionAnswerToMessage,
  onText,
  onPhoto,
  onFile,
  onVideo,
  onlyForward,
  showHelpInfo
}
