const {MenuTemplate, MenuMiddleware, createBackMainMenuButtons} = require('telegraf-inline-menu')
const locationGame = require('../location/locationGame.schema')
let a;
locationGame.find().then(e => {
  a = 20
})
const game = new MenuTemplate(() => 'Main Menu test')
for (let i = 1; i < a; i++) {
  const game = new MenuTemplate('game descriptors full ' + i)
  game.interact('play game', 'game unic name', {
    do: ctx => {
      ctx.deleteMessage()
      ctx.reply('Now you playing game ' + i)
      return true
    }
  })
  game.manualRow(createBackMainMenuButtons('back', 'go to Main game'))
  game.submenu('Game name ' + i, 'gameCode' + i, game, {
    // hide: () => mainMenuToggle,
  })

}

const menuMiddleware = new MenuMiddleware('game/', game)

console.log(menuMiddleware.tree())

module.exports = menuMiddleware
