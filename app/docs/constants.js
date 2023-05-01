const playStatuses = {
    goingToLocation: 'goingLocation',
    inLocation: 'inLocation',
    playingClue: 'playingClue',
    playingLevelUp: 'playingLevelUp',
    finishedGame: 'finishedGame',
}
const clueTypes = {
    levelUp: "levelUp",
    standardGame: "standardGame"
}

const initUserSession = {
    teamName: "",
    telegramId: null,
    playStatus: "",
    playingClueId: null,
    playingLocationCurrentStep: 0,
    playedGames: [],
    locationPoint: 0,
    allPoint: 0,
    playingClueTime: null,
};
const gameConfig = {
    choosingLevelUpGame: false,
    levelUpCountTime: false,  //if true, count time for level up game //todo
}

module.exports = {
    playStatuses,
    initUserSession,
    gameConfig,
    clueTypes
};