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

const texts = {
    startGameText: `Բարի գալուստ։ Շնորհավորում ենք: Դուք ունեք բացառիկ հնարավորություն\` մասնակցելու <b>All inclusive Armenia</b> ընկերության կողմից կազմակերպված քաղաքային քվեսթին, որը տեղի է ունենում <b>Կորպորատիվ Օլիմպիական Խաղերի (ԿՕԽ)</b> շրջանակում։  Ձեզ սպասում են հետաքրքիր ու յուրահատուկ խաղեր, որոնք երբևէ չեք խաղացել։ Ձեզ մոտ կան թղթապանակներ, որոնց մեջ գտնվող իրերը օգնելու են հաղթահարել մեր խաղերը։ Թղթապանակի մեջ գտեք առաջին խաղը, լուծեք առաջադրանքը և քվեսթը շարունակելու համար մեզ ուղարկեք արդյունքում ստացած թիվը. դա Ձեր թիմի կոդն է:`,

    teamName:`Շնորհավորում ենք Ձեզ: Դուք խաղի մեջ եք:\nԱյժմ գրեք Ձեր թիմի անունը\` խաղը շարունակելու համար։`,
    anotherTeamName: "Խնդրում եմ կրկին գրեք Ձեր թիմի անունը",
    teamNameSuccess: "Այժմ սկսելու են խաղերը, որոնց արդյունքում Դուք պետք է վաստակեք 50 միավոր` Ձեր նվերը գտնելու համար։",
    levelUpStartText: "Դուք հավաքեցիք բավականաչափ միավոր, վերջին փորձությունը հաղթահարելու համար:",
    rejectMessage: "Ձեր ուղարկված պատասխանը սխալ է։ Խնդրում ենք նորից փորձել։",
    notWinners: "Անչափ շնորհակալ ենք ձեր մասնակցության և ոգևորության համար։ Բայց մենք արդեն ունենք հաղթող",
    // bob: `Շնորհավորում եմ Ձեզ: Դուք խաղի մեջ եք:\nԱյժմ կարող եք սկսել խաղը։`,
}

module.exports = {
    playStatuses,
    initUserSession,
    gameConfig,
    clueTypes,
    texts
};