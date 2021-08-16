const {MenuTemplate, MenuMiddleware, createBackMainMenuButtons} = require('telegraf-inline-menu')

const menu = new MenuTemplate(() => 'Main Menu test')

for (let i = 1; i < 10; i++) {
  const game = new MenuTemplate('game descriptors full ' + i)
  game.interact('play game', 'game unic name', {
    do: ctx => {
      ctx.deleteMessage()
      ctx.reply('Now you playing game ' + i)

      return true
    }
  })
  game.manualRow(createBackMainMenuButtons('back', 'go to Main menu'))
  menu.submenu('Game name ' + i, 'gameCode' + i, game, {
    // hide: () => mainMenuToggle,
  })

}

const menuMiddleware = new MenuMiddleware('game/', menu)

console.log(menuMiddleware.tree())

module.exports = menuMiddleware
