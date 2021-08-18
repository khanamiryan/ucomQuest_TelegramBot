const {MenuTemplate, MenuMiddleware, createBackMainMenuButtons} = require('telegraf-inline-menu')
const Users = require('../user/user.schema')

const findUsers = async (condition ={}) => {
  return Users.find({...condition,role: 'player', first_name: { $exists: true }})
}

const menu = new MenuTemplate(() => 'Admin page')
menu.interact(`User List`, 'userList', {
  do: async (ctx) => {
    ctx.deleteMessage()
    const users = await findUsers({
      adminId: ctx.state.userData_Id
    })
    let userButtons = [
      [{ text: '<< back', callback_data: 'back' }]
    ];
    for(const user of users){
      userButtons.unshift([
        { text: `code: ${user.code}`, callback_data: `textTo:${user.id}:${user.code}` },
      ])
    }
    ctx.reply(`Users: ${userButtons.length - 1}`, { reply_markup: JSON.stringify({ inline_keyboard: userButtons})})
    return false
  }
});

menu.manualRow(createBackMainMenuButtons())
// menu.submenu('User List', 'userList', userList, {
//   // hide: () => mainMenuToggle,
// })


const menuMiddleware = new MenuMiddleware('admin/', menu)

console.log(menuMiddleware.tree())

module.exports = menuMiddleware
