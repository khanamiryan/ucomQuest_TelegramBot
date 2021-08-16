const {MenuTemplate, MenuMiddleware, createBackMainMenuButtons} = require('telegraf-inline-menu')
const Users = require('../user/user.schema')

const findUsers = async () => {
  return Users.find({role: 'player'})
}
let userButtons = [
  [{ text: '<< back', callback_data: 'back' }]
];
(async () => {
  const users = await findUsers()
  for(const user of users){
    userButtons.unshift([
      { text: user.first_name, callback_data: `textTo:${user.id}:${user.first_name}` },
    ])
  };
})()

const menu = new MenuTemplate(() => 'Admin page')
menu.interact(`User List`, 'userList', {
  do: async (ctx) => {
    ctx.deleteMessage()
    ctx.reply(`Users: ${userButtons.length - 1}`, { reply_markup: JSON.stringify({ inline_keyboard: userButtons,
        resize_keyboard: true,
        one_time_keyboard: true,
        force_reply: true,
      })})
    return false
  }
});

menu.manualRow(createBackMainMenuButtons('back', 'go to Main menu'))
// menu.submenu('User List', 'userList', userList, {
//   // hide: () => mainMenuToggle,
// })


const menuMiddleware = new MenuMiddleware('admin/', menu)

console.log(menuMiddleware.tree())

module.exports = menuMiddleware
