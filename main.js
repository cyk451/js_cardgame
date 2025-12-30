
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

const ENEMIES = [
    { name: "Slime", type: 'minor', hp: 30, maxHp: 30, atk: 6, counter: 3, maxCounter: 3 },
    { name: "Bat", type: 'minor', hp: 15, maxHp: 15, atk: 4, counter: 2, maxCounter: 2 }
];

// --- 2. Game State ---
// let selectedDeck = [];
let game = null;
// let deck = [];
let MAX_SIZE = document.getElementById('max_cards').innerHTML;

class HPbar {
    constructor(maxHp) {
		this.view = null;
		this.maxHp = maxHp;
        this.view = document.createElement("div");
        this.view.classList.add("hp-container");
        const hpbar = document.createElement("div");
        hpbar.classList.add("hp-bar");
        this.fill = document.createElement("div");
        this.fill.classList.add("hp-fill");
		this.text = document.createElement("div");
        this.text.classList.add("hp-text");
		this.text.innerText = `${maxHp}/${maxHp}`;
		hpbar.replaceChildren(this.fill);
		this.view.append(hpbar, this.text);
	}
    createElement() {
		return this.view;
	}
	update(current) {
		current = Math.max(0, Math.min(this.maxHp, current));
		if (this.view === null) return ;
		// const text = this.view.querySelector(".hp-text");

		const ratio = Math.max(0, current * 100/ this.maxHp);
        console.log("new rat " + ratio);
		this.fill.style.width = `${ratio}%`;
		this.view.classList.add('damage');

		setTimeout(() => container.classList.remove("damage"), 150);
		// text.textContent = `${current} / ${max}`;

		// Color shift at low HP
		if (ratio < 0.3) {
			this.fill.style.background = "#e74c3c";
		} else if (ratio < 0.6) {
			this.fill.style.background = "#f1c40f";
		} else {
			this.fill.style.background = "linear-gradient(to right, #3adb76, #1fa84f)";
		}
	}
}

class Enemy {
    constructor(temp) {
        for(var c in temp) {
            // console.log(k);
            this[c]=temp[c];
		}
		this.hpbar = new HPbar(this.hp);
        const div = document.createElement("div");
        div.classList.add("monster");
        // div.dataset.cardId = this.id;

        const name = document.createElement("span");
		name.innerText = this.name;
        this.counterView = document.createElement("span");
		this.counterView.classList.add("monster-counter");
        div.append(name, this.counterView, 
			document.createElement("br"), this.hpbar.createElement());

        div.style.backgroundImage = `url('./assets/mobs/${this.name}.jpeg')`;
        div.style.backgroundSize = "cover";
        this.element = div;
    }
	createElement() { 
		this.counterView.innerText = this.counter;
		return this.element; 
	}

	dealDamage(damage) {
		this.hpbar.update(this.hp -= damage);
	}

    act(player) {
		if (this.counter > 0) return;
		player.dealDamage(this.atk);
    }

	reset() {
		this.counter = this.maxCounter;
	}
}

class Card {
    constructor(temp) {
        for(var k in temp) {
            // console.log(k);
            this[k]=temp[k];
        }
        const div = document.createElement("div");
        div.classList.add("card", this.type);
        // div.dataset.cardId = this.id;

        const title = document.createElement("b");
        title.textContent = this.name;

        const cost = document.createElement("b");
        cost.textContent = this.cost;

        const desc = document.createElement("small");
        desc.textContent = this.desc;

        div.append(title, cost, document.createElement("br"), desc);

        div.style.backgroundImage = `url('./assets/cards/${this.name}.jpeg')`;
        div.style.backgroundSize = "cover";
        this.element = div;
    }

    createElement() {
      return this.element;
    }
    
}

// --- 3. Deck Building Logic ---
function initSetup() {
    const libZone = document.getElementById('library-zone');
    // let cardLibs = [];
    CARD_LIBRARY.forEach(cardTemp => {
        let prev = document.getElementById('deck-preview');
        let card = new Card(cardTemp);
        let cdiv = card.createElement();
        cdiv.onclick = () => {
            if (deck.length == MAX_SIZE) return ;
            let inst = new Card(card);
            deck.push(inst); 
            document.getElementById('count').innerText = deck.length;
            prev.appendChild(inst.createElement());
            if (deck.length == MAX_SIZE) {
                document.getElementById('start-btn').style.display = 'block';
            }
            
        }; // onclick
        // cardLibs.appendChild(card);
        libZone.appendChild(cdiv);
            // console.log("adding a card...");
        });
}

class Player {
	constructor(hp, ap) {
        console.log("added hp bar??");
		this.hp = hp;
		this.maxHp = hp;
		this.ap = ap;
		this.maxAp = ap;
		this.hpbar = new HPbar(hp);
		const stat = document.getElementById("stat-bar")
        stat.append(this.hpbar.createElement());
	}
	dealDamage(dmg) {
		this.hpbar.update(this.hp -= dmg);
	}
}

// --- 4. Core Game Engine ---
class CardGame {
    constructor(deck) {
        this.mZone = document.getElementById('monster-zone');
        this.pendingCard = null;
        console.log("added player??");
        this.player = new Player(50, 3);
        this.deck = deck;
        this.hand = [];
        this.tomb = [];
        this.enemies = ENEMIES.map(m => new Enemy(m));
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
        // const card = this.hand[cardIndex]
        
        var card = this.pendingCard;
        
        console.log(`playing ${card.name}`);
        // Basic checks
        if (this.player.ap < card.cost) return;

        // Execute Attack
        if (card.type === 'attack') {
            if (card.area) {
                this.enemies.forEach(e => e.dealDamage(card.damage));
            } else if (target !== null) {
                target.dealDamage(card.damage);
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
		this.enemies.forEach(e => e.act(this.player));
        this.checkState();
    }

    startTurn() {
        this.player.ap = this.player.maxAp;
        this.draw(5);
		this.enemies.forEach(e => e.reset());
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
		// document.getElementById('player-hp').innerText = this.player.hp;
		// document.getElementById('player-ap').innerText = this.player.ap;
		document.getElementById('pile-counts').innerText = `Deck: ${this.deck.length} | Tomb: ${this.tomb.length}`;

		// Enemies
		this.mZone.replaceChildren(...this.enemies.map(
			enemy => {
					const div = enemy.createElement();
					
					div.ondrop = (e) => {
						e.preventDefault();
						this.playCard(enemy);
					};

					div.ondragover = (e) => {
						console.log("onDrag over ${enemy.name}");
						e.preventDefault();
					};
					return (div);
				}));
		// Hand
		const hZone = document.getElementById('hand-zone');
		hZone.replaceChildren(...this.hand.map(
            card => {
                let cardDiv = card.createElement();
                cardDiv.draggable = "true";
                cardDiv.ondragstart = (e) => {
                    console.log(`startDrag ${e.target.id}`);
                    this.pendingCard = card;
                    cardDiv.classList.remove("selected");
                };
                cardDiv.ondragend = (e) => {
                    console.log(`endDrag ${e.target.id}`);
                    this.pendingCard = null;
                    cardDiv.classList.remove("selected");
                };
                return cardDiv;
            }));
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

for (i = 0; i < 14; ++i) deck.push(new Card(CARD_LIBRARY[Math.floor(Math.random() * CARD_LIBRARY.length)]));

initSetup();
