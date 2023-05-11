var cell_size = 120;

function cell_action(cell_num) {
    if (cells[cell_num].owner == 'npc') {
        switch (cell_num) {
            default:
                const trade_element = document.createElement('div');
                trade_element.classList.add('trade-popup');
                trade_element.id = 'closed-trade';
                trade_element.innerHTML = ('\
                <button onclick="tradeAction(true)">bet</button>\
                <button onclick="tradeAction(false)">leave</button>\
                <p>current cost</p>\
                <p id = cost>0</p>\
                ');
                play_space.appendChild(trade_element);
                document.getElementById('cost').innerText = cells[players[playerId].cell].price;
                break;
        }
    } else {
        if (cells[cell_num].owner != playerId) {
            console.log('rent');
            const updates = {};
            updates['/players/' + playerId + '/balance/'] = players[playerId].balance - cells[cell_num].rent;
            updates['/players/' + cells[cell_num].owner + '/balance/'] = players[cells[cell_num].owner].balance + cells[cell_num].rent;
            update(ref(database), updates);
        }
    }
}

function openAuction(initiator) {
    const auc_element = document.createElement('span');
    auc_element.id = 'auction';
    Object.keys(players).forEach((key) => {
        const candidate_element = document.createElement('div');
        const candidate_name = document.createElement('p');
        candidate_name.innerText = (key == initiator ? "npc" : key);
        candidate_element.classList.add('candidate-card');
        candidate_element.innerHTML = ('<button onclick="aucAction(' + initiator + ')">+</button> ');
        candidate_element.appendChild(candidate_name);
        auc_element.appendChild(candidate_element);
    });
    play_space.appendChild(auc_element);
}

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js"
import { getDatabase, ref, set, onValue, onDisconnect, onChildAdded, onChildRemoved, update } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js"
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

let cellsRef;
let cells;
let aucRef;

const play_space = document.getElementById('play-space');

function game_init() {
    const all_players_ref = ref(database, '/players');
    aucRef = ref(database, '/auction/');


    onValue(cellsRef, (snapshot) => {

        cells = snapshot.val();

    });

    onValue(aucRef, (snapshot) => {
        if (snapshot.val() && snapshot.val().ongoing == true) {
            openAuction(snapshot.val().initiator);
        }
    });
    
    onValue(all_players_ref, (snapshot) => {

        players = snapshot.val() || {};
        Object.keys(players).forEach((key) => {
            const characterState = players[key];
            let el = playerElements[key];
            el.style.left = 160 + cells[players[key].cell].coords.x * cell_size;
            el.style.top = 100 + cells[players[key].cell].coords.y * cell_size;

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

        cellsRef = ref(database, '/cells/');

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
    const updates = {};
    updates['/players/' + playerId + '/cell/'] = (roll + players[playerId].cell) % 16;
    update(ref(database), updates);
}

window.tradeAction = function tradeAction(code) {
    if (code) {
        const cost_value = document.getElementById('cost');
        const current_cell = cells[players[playerId].cell]
        if (Number(cost_value.innerText) < current_cell.ceiling) {        
            if (Math.random() > current_cell.pliability) {
                cost_value.innerText = Number(cost_value.innerText) + current_cell.step;
            } else {
                play_space.removeChild(document.getElementById('closed-trade'));
                const updates = {};
                updates['/cells/' + players[playerId].cell + '/owner/'] = playerId;
                updates['/players/' + playerId + '/balance/'] = players[playerId].balance - Number(cost_value.innerText);
                update(ref(database), updates);
                }
        } else {
            play_space.removeChild(document.getElementById('closed-trade'));
            const updates = {};
            updates['/cells/' + players[playerId].cell + '/owner/'] = playerId;
            updates['/players/' + playerId + '/balance/'] = players[playerId].balance - Number(cost_value.innerText);
            update(ref(database), updates);

        }
    } else {
        play_space.removeChild(document.getElementById('closed-trade'));
    }
}

window.startAuction = function startAuction() {
    set(aucRef, {
        ongoing: true,
        initiator: playerId
    });
}

window.aucAction = function aucAction(initiator) {

}