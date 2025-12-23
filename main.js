
// --- 1. Data Configuration ---
const CARD_LIBRARY = [
    { 
		id: 0, 
		name: "Slash", 
		type: "attack", 
		cost: 1, 
		damage: 6, 
		desc: "6 DMG",
	},
    {
		id: 1,
		name: "Big Smash",
		type: "attack",
		cost: 2,
		damage: 14,
		desc: "14 DMG" 
	},
    { 
		id: 2,
		name: "Cleave",
		type: "attack",
		cost: 2,
		damage: 5,
		area: true,
		desc: "5 AOE DMG" },

    { 
		id: 3,
		name: "Focus",
		type: "skill",
		cost: 0,
		effect: "gainAP",
		value: 1,
		desc: "+1 AP"
	},
    { 
		id: 4,
		name: "Meditate",
		type: "skill",
		cost: 1,
		effect: "draw",
		value: 2,
		desc: "Draw 2" 
	}
];

const MONSTERS = [
    { name: "Slime", hp: 30, maxHp: 30, atk: 6, counter: 3, maxCounter: 3 },
    { name: "Bat", hp: 15, maxHp: 15, atk: 4, counter: 2, maxCounter: 2 }
];

// --- 2. Game State ---
// let selectedDeck = [];
let game = null;
// let deck = [];
let MAX_SIZE = document.getElementById('max_cards').innerHTML;

class Monster {
    constructor() {
    }
}

class Card {
    constructor(temp) {
        for(var k in temp) {
            // console.log(k);
            this[k]=temp[k];
        }
    }
    
    asDiv() {
        const div = document.createElement('div');
        let modifier = "";
        div.className = `card ${this.type}`;
        div.innerHTML = `<b>${this.name}</b><br><small>${this.desc}</small>`;
        div.style.backgroundImage = `url('./assets/cards/${this.name}.jpeg')`;
        div.style.backgroundSize = "cover";

        return div;
    }
}

// --- 3. Deck Building Logic ---
function initSetup() {
    const libZone = document.getElementById('library-zone');
    // let cardLibs = [];
    CARD_LIBRARY.forEach(cardTemp => {
        let prev = document.getElementById('deck-preview');
        let card = new Card(cardTemp);
        let cdiv = card.asDiv();
        cdiv.onclick = () => {
            if (deck.length == MAX_SIZE) return ;
            let inst = new Card(card);
            deck.push(inst); 
            document.getElementById('count').innerText = deck.length;
            prev.appendChild(inst.asDiv());
            if (deck.length == MAX_SIZE) {
                document.getElementById('start-btn').style.display = 'block';
            }
            
        }; // onclick
        // cardLibs.appendChild(card);
        libZone.appendChild(cdiv);
            // console.log("adding a card...");
        });
/*
        const div = document.createElement('div');
        div.className = `card ${card.type}`;
        div.innerHTML = `<b>${card.name}</b><small>${card.desc}</small><span>Cost: ${card.cost}</span>`;
        div.onclick = () => {
            if (selectedDeck.length < 15) {
                selectedDeck.push(card.id);
                document.getElementById('count').innerText = selectedDeck.length;
                if (selectedDeck.length === 15) document.getElementById('start-btn').style.display = 'block';
            }
        };
        libZone.appendChild(div);
*/
}

// --- 4. Core Game Engine ---
class CardGame {
    constructor(deck) {
        this.mZone = document.getElementById('monster-zone');
        this.pendingCard = null;
        this.player = { hp: 50, ap: 3, maxAp: 3 };
        this.deck = deck;
        this.hand = [];
        this.tomb = [];
        this.enemies = MONSTERS.map(m => ({ ...m }));
        this.shuffle();
        this.startTurn();
		this.selectedCardIndex = null; // Track the card being held
    }

    shuffle() { this.deck.sort(() => Math.random() - 0.5); }

    log(msg) {
        const l = document.getElementById('log');
        l.innerHTML = msg + "<br>" + l.innerHTML;
    }

    draw(count) {
        for (let i = 0; i < count; i++) {
            if (this.deck.length === 0) {
                if (this.tomb.length === 0) return;
                this.deck = [...this.tomb];
                this.tomb = [];
                this.shuffle();
                this.log("Deck reshuffled.");
            }
            this.hand.push(this.deck.pop());
        }
    }


	playCard(target = null) {
        // const card = this.hand[cardIndex];
        
        var card = this.pendingCard;
        
        console.log(`playing ${card.name}`);
        // Basic checks
        if (this.player.ap < card.cost) return;

        // Execute Attack
        if (card.type === 'attack') {
            if (card.area) {
                this.enemies.forEach(e => e.hp -= card.damage);
            } else if (target !== null) {
                target.hp -= card.damage;
            } 
        } else {
            if (card.effect === 'gainAP') this.player.ap += card.value;
            if (card.effect === 'draw') this.draw(card.value);
        }

        // Cleanup
        this.player.ap -= card.cost;
        this.hand.forEach((c, i) => {
            if (c == card) 
                this.hand.splice(i, 1);
        })
        this.tomb.push(card);
        this.selectedCardIndex = null; // Reset selection
        this.processMoves();
        this.render();
    }

    processMoves() {
        this.enemies.forEach(e => {
            e.counter--;
            if (e.counter <= 0) this.enemyAct(e);
        });
        this.checkState();
    }

    enemyAct(e) {
        this.log(`${e.name} attacks for ${e.atk}!`);
        this.player.hp -= e.atk;
        e.counter = e.maxCounter;
    }

    startTurn() {
        this.player.ap = this.player.maxAp;
        this.draw(5);
        this.render();
    }

    checkState() {
        this.enemies = this.enemies.filter(e => e.hp > 0);
        if (this.enemies.length === 0) alert("Victory!");
        if (this.player.hp <= 0) alert("Game Over!");
    }
	// --- 5. UI Rendering ---
	render() {
		// Stats
		document.getElementById('player-hp').innerText = this.player.hp;
		document.getElementById('player-ap').innerText = this.player.ap;
		document.getElementById('pile-counts').innerText = `Deck: ${this.deck.length} | Tomb: ${this.tomb.length}`;

		// Enemies
		this.mZone.innerHTML = "";
		this.enemies.forEach((enemy, enemyIndex) => {
            const div = document.createElement('div');
            div.className = `monster ${this.selectedCardIndex !== null ? 'targetable' : ''}`;
            div.innerHTML = `<img src="${enemy.img}"><b>${enemy.name}</b><br>HP: ${enemy.hp}`;
            
            div.ondrop = (e) => {
                e.preventDefault();
                this.playCard(enemy);
            };

            div.ondragover = (e) => {
                console.log("onDrag over ${enemy.name}");
                e.preventDefault();
            };
            this.mZone.appendChild(div);
        });
        /*
        this.mZone.ondrop = (e) => {
            e.preventDefault();
            this.playCard();
        };

        this.mZone.ondragover = (e) => {
            console.log("onDrag over");
            e.preventDefault();
        };
        */
		// Hand
		const hZone = document.getElementById('hand-zone');
		hZone.innerHTML = "";
		this.hand.forEach(card => {
            let cardDiv = card.asDiv();
            cardDiv.draggable = "true";
            cardDiv.ondragstart = (e) => {
                console.log(`startDrag ${e.target.id}`);
                this.pendingCard = card;
                cardDiv.className += " selected";
            };
            hZone.appendChild(cardDiv);
        });
	}
}


function startGame() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    game = new CardGame(deck);
}

function handleEndTurn() {
    // Monsters that didn't act yet act now
    game.enemies.forEach(e => {
        if (e.counter > 0) game.enemyAct(e);
    });
    game.tomb.push(...game.hand);
    game.hand = [];
    game.startTurn();
}
let deck = [
];

initSetup();
