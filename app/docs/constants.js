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
    startGameText: `Բարի գալուստ։
Շնորհավորում ենք դուք ունեք բացառիկ հնարավորություն մասնակցելու 
<b>All Inclusive Armenia</b> 
ընկերության կողմից կազմակերպված քաղաքային քվեստին։ 
Ձեզ սպասվում են հետաքրքիր ու յուրահատուկ խաղեր, որոնք երբևէ չեք խաղացել։
Ձեր  մոտ կան թղթապանակներ, դրա մեջ գտնվող իրերը օգնելու են հաղթահարել մեր խաղերը։ 
Գտեք այնտեղից առաջին խաղը։ 
Այն լուծելու արդյունքում ուղարկեք մեզ ձեր թիմի կոդը, որպեսզի շարունակենք խաղալ։`,

    teamName:`Շնորհավորում եմ Ձեզ: Դուք խաղի մեջ եք:\nԱյժմ գրեք Ձեր թիմի անունը, որպեսզի շարունակենք մեր խաղը։`,
    anotherTeamName: "Խնդրում եմ կրկին գրեք Ձեր թիմի անունը",
    bob: `Շնորհավորում եմ Ձեզ: Դուք խաղի մեջ եք:\nԱյժմ կարող եք սկսել խաղը։`,
}

module.exports = {
    playStatuses,
    initUserSession,
    gameConfig,
    clueTypes,
    texts
};