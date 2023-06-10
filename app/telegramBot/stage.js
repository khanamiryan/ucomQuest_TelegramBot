const {Scenes} = require("telegraf");
const startGame = require("./scenes/startGameScene");
const createTeamName = require("./scenes/createTeamNameScene");
const locationScene = require("./scenes/locationScene");
const {adminScene, messageToAllScene} = require("./adminScene");
const { levelUpScene, finishGameScene, goingToLocationScene} = require("./scenes");
const resetScene = require("./scenes/resetGameScene");
const clueScene = require("./scenes/clueScene");

const stage = new Scenes.Stage([
    startGame,
    createTeamName,
    locationScene,
    adminScene,
    clueScene,
    levelUpScene,
    finishGameScene,
    goingToLocationScene,
    resetScene,
    messageToAllScene
]);

module.exports = stage;
