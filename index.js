class grid_cell {
    constructor(coords){
        this.coords = coords;
        this.start_price = 100;
        this.price_step = 10;
        this.price_ceiling = 200;
        this.pliability = 0.5;
    };
}

var grid_cells = {
    0: new grid_cell({x: 0,y: 0}),
    1: new grid_cell({x:1 ,y:0 }),
    2: new grid_cell({x:2 ,y:0 }),
    3: new grid_cell({x:3 ,y:0 }),
    4: new grid_cell({x:4 ,y:0 }),
    5: new grid_cell({x:4 ,y:1 }),
    6: new grid_cell({x:4 ,y:2 }),
    7: new grid_cell({x:4 ,y:3 }),
    8: new grid_cell({x:4 ,y:4 }),
    9: new grid_cell({x: 3,y: 4}),
    10: new grid_cell({x: 2,y: 4}),
    11: new grid_cell({x: 1,y: 4}),
    12: new grid_cell({x: 0,y: 4}),
    13: new grid_cell({x: 0,y: 3}),
    14: new grid_cell({x: 0,y: 2}),
    15: new grid_cell({x: 0,y: 1})
};

var cell_size = 120;

function cell_action(cell_num) {
    switch (cell_num) {
        default:
            console.log('hey)');
            const trade_element = document.createElement('div');
            trade_element.classList.add('trade_popup');
            trade_element.id = 'closed_trade';
            trade_element.innerHTML = ('\
            <button onclick="tradeAction(true)">bet</button>\
            <button onclick="tradeAction(false)">leave</button>\
            <p>current cost</p>\
            <p id = cost>0</p>\
            ');
            play_space.appendChild(trade_element);
            document.getElementById('cost').innerText = grid_cells[players[playerId].cell].start_price;
            break;
    }   
}

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
            el.style.left = 160 + grid_cells[players[key].cell].coords.x * cell_size;
            el.style.top = 100 + grid_cells[players[key].cell].coords.y * cell_size;

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
            balance: 1000,
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
    cell_action((roll + players[playerId].cell) % 16);
    console.log(roll);
    set(playerRef, {
        id: playerId,
        cell: (roll + players[playerId].cell) % 16
    });
}

window.tradeAction = function tradeAction(code) {
    if (code) {
        const cost_value = document.getElementById('cost');
        const current_cell = grid_cells[players[playerId].cell]
        if (Number(cost_value.innerText) < current_cell.price_ceiling) {        
            if (Math.random() > current_cell.pliability) {
                    cost_value.innerText = Number(cost_value.innerText) + current_cell.price_step;
                } else {
                    play_space.removeChild(document.getElementById('closed_trade'));
                }
        } else {
            play_space.removeChild(document.getElementById('closed_trade'));
        }
    } else {
        play_space.removeChild(document.getElementById('closed_trade'));
    }
}