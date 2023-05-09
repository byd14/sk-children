var cell_2_coords = {
    0: {x: 0,y: 0},
    1: {x:1 ,y:0 },
    2: {x:2 ,y:0 },
    3: {x:3 ,y:0 },
    4: {x:4 ,y:0 },
    5: {x:4 ,y:1 },
    6: {x:4 ,y:2 },
    7: {x:4 ,y:3 },
    8: {x:4 ,y:4 },
    9: {x: 3,y: 4},
    10: {x: 2,y: 4},
    11: {x: 1,y: 4},
    12: {x: 0,y: 4},
    13: {x: 0,y: 3},
    14: {x: 0,y: 2},
    15: {x: 0,y: 1},
};
var cell_size = 120;

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js"
import { getDatabase, ref, set, onValue, onDisconnect, onChildAdded, onChildRemoved } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCfcdGLga6HIfTmOjSRV7GLmolhgmbIa6E",
    authDomain: "sync-demo-14ab7.firebaseapp.com",
    databaseURL: "https://sync-demo-14ab7-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sync-demo-14ab7",
    storageBucket: "sync-demo-14ab7.appspot.com",
    messagingSenderId: "159205559763",
    appId: "1:159205559763:web:1672b486656fd2c3097326"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

let playerId;
let playerRef;
let players = {};
let playerElements = {};

const play_space = document.getElementById('play-space');

function game_init() {
    const all_players_ref = ref(database, '/players')
    
    onValue(all_players_ref, (snapshot) => {

        players = snapshot.val() || {};
        Object.keys(players).forEach((key) => {
            const characterState = players[key];
            let el = playerElements[key];
            el.style.left = 160 + cell_2_coords[players[key].cell].x * cell_size;
            el.style.top = 100 + cell_2_coords[players[key].cell].y * cell_size;
        });

    });
    onChildAdded(all_players_ref, (snapshot) => {
        const added_player = snapshot.val();
        const character_element = document.createElement('div');
        character_element.classList.add('chara');
        
        if (added_player.id === playerId) {
            character_element.classList.add('you');
        }

        playerElements[added_player.id] = character_element;
        play_space.appendChild(character_element);
    });
    onChildRemoved(all_players_ref, (snapshot) => {
        const removed_key = snapshot.val().id;
        play_space.removeChild(playerElements[removed_key]);
        delete playerElements[removed_key];
    });

}

signInAnonymously(auth)
.then(() => {
    // Signed in..
})
.catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(errorCode, errorMessage);
    // ...
});
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        playerId = user.uid;
        console.log(playerId);
        playerRef = ref(database, '/players/' + playerId);
        set(playerRef, {
            id: playerId,
            cell: 0
        });

        //Initialize game for connected player
        game_init();

        //Remove player data on disconnect
        onDisconnect(playerRef).remove();
        
    } else {
        // User is signed out
        // ...
    }
});

window.diceRoll = function diceRoll(){
    var roll = Math.floor(Math.random() * 6 + 1)
    console.log(Object.keys(players).length);
    set(playerRef, {
        id: playerId,
        cell: (roll + players[playerId].cell) % 16
    });
}