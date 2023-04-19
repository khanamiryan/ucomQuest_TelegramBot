
import {getPlayerGameAndLocationTimes} from "./game";
import {getClueById} from "../api/clue/clue";

export function sendMessageTo(){

}
//
// export async function updateUserLocationToNextLocation(telegramId, ){
//     try {
//         const user = await getUserByTelegramId(telegramId);
//         const currentLocationId = user.playingLocationId;
//         const currentLocation = await getLocationDataById(currentLocationId);
//
//         const nextLocationId = user.playingLocationSteps[currentLocation]||playingLocationSteps[0];
//         const nextLocation = await getLocationDataById(currentLocation);
//         let nextPlayStatus;
//         if(nextLocation?.needToGoBeforeStart) {
//             nextPlayStatus = "goingLocation";
//         }else {
//             nextPlayStatus = "playingGame";
//         }
//         await updateUserByTelegramId({
//             telegramId: telegramId,
//             data: {
//                 playingLocationId: nextLocation,
//                 playStatus:nextPlayStatus,
//                 playingGameId: undefined,
//                 $unset: {playingLocationTime: "", playingGameTime: ""},
//             }
//         });
//     }catch (e) {
//         console.log("error on updateUser", e.message)
//     }
//
//
// }




module.exports = {
    // getPlayerInfoText,
}