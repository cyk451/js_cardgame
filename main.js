
// --- 1. Data Configuration ---
const CARD_LIBRARY = [
    {
        id: 0,
        name: "Slash",
        type: "attack",
        cost: 1,
        damage: 6,
        desc: "6 DMG",
        requireTarget: true,
    },
    {
        id: 1,
        name: "Big Smash",
        type: "attack",
        cost: 2,
        damage: 14,
        desc: "14 DMG",
        requireTarget: true,
    },
    {
        id: 2,
        name: "Cleave",
        type: "attack",
        cost: 2,
        damage: 5,
        area: true,
        desc: "5 AOE DMG",
        requireTarget: false,
    },

    {
        id: 3,
        name: "Focus",
        type: "skill",
        cost: 0,
        effect: "gainAP",
        value: 1,
        desc: "+1 AP",
        requireTarget: false,
    },
    {
        id: 4,
        name: "Meditate",
        type: "skill",
        cost: 1,
        effect: "draw",
        value: 2,
        desc: "Draw 2",
        requireTarget: false,
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
    update(current, damaged) {
        current = Math.max(0, Math.min(this.maxHp, current));
        const ele = this.view;
        if (ele === null) return ;
        // const text = this.view.querySelector(".hp-text");

        const ratio = Math.max(0, current * 100/ this.maxHp);
        console.log("new rat " + ratio);
        this.fill.style.width = `${ratio}%`;
        this.text.innerText = `${current}/${this.maxHp}`;
        console.log( `${current}/${this.maxHp}`);
        if (damaged == true) {
            ele.classList.add('damage');
            setTimeout(() => ele.classList.remove("damage"), 150);
        }

        // Color shift at low HP
        if (ratio < 30) {
            this.fill.style.background = "#e74c3c";
        } else if (ratio < 60) {
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
        this.counterView.innerText = (this.counter > 0)? this.counter: '-';
        return this.element;
    }

    dealDamage(damage) {
        this.hpbar.update(this.hp -= damage, damage > 0);
    }

    act(player) {
        if (--this.counter == 0)
            player.dealDamage(this.atk);
    }

    eof(player) {
        if (this.counter > 0)
            player.dealDamage(this.atk);
    }

    reset() {
        this.counter = this.maxCounter;
    }

    setTargetable(targetable, card) {
        const div = this.element;
        div.ondrop = targetable? (e) => {
            e.preventDefault();
            game.playCard(card, {
                "x": e.clientX,
                "y": e.clientY,
            }, this);
        }: null;

        div.ondragover = targetable? (e) => {
            console.log("onDrag over ${enemy.name}");
            e.preventDefault();
        }: null;
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
        // return this.element;
        this.div = this.element.cloneNode(true);
        return this.div;
    }
    // this function is async
    flyTo(from, end, onfinish = null) {
        const clone = this.createElement();

        clone.style.position = "fixed";
        clone.style.left = `${from.left}px`;
        clone.style.top = `${from.top}px`;
        clone.style.width = from.width;
        clone.style.height = from.height;
        clone.style.margin = "0";
        clone.style.pointerEvents = "none";
        clone.style.zIndex = "9999";
        clone.classList.add("flying-card");

        document.body.appendChild(clone);

        const dx = end.left + end.width / 2 - (from.left + from.width / 2);
        const dy = end.top + end.height / 2 - (from.top + from.height / 2);

        requestAnimationFrame(() => {
            console.log("updateFrame");
            clone.style.transform = `
              translate(${dx}px, ${dy}px)
            `;
            clone.style.opacity = "0.8";
            });

        clone.addEventListener("transitionend", () => {
            console.log("removed");
            clone.remove();
            if (onfinish !== null) onfinish();
            }, { once: true });
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
        this.hp = hp;
        this.maxHp = hp;
        this.ap = ap;
        this.maxAp = ap;
        this.hpbar = new HPbar(hp);
        const stat = document.getElementById("stat-bar");
        const div = this.hpbar.createElement();
        div.classList.add("player");
        this.apbar = document.createElement("div");
        this.updateAp();
        stat.append(div, document.createElement('br'), this.apbar);
    }
    updateAp() {
        var ap_txt = "&nbsp;";
        var i = 0;
        for (i = 0; i < 9; ++i) {
            if (i < this.ap)
                ap_txt += "&nbsp;⬤&nbsp;";
            else
                ap_txt += "&nbsp;〇&nbsp;";
        }
        ap_txt += "&nbsp;";
        this.apbar.innerHTML = ap_txt;
    }
    dealDamage(dmg) {
        this.hpbar.update(this.hp -= dmg, dmg > 0);
    }
}

// --- 4. Core Game Engine ---
class CardGame {
    constructor(deck) {
        this.mZone = document.getElementById('monster-zone');
        this.mTomb = document.getElementById('tomb-zone');
        this.mDeck = document.getElementById('deck-zone');
        this.mHand = document.getElementById('hand-zone');
        this.pendingCard = null;
        console.log("added player??");
        this.player = new Player(50, 3);
        this.deck = deck;
        this.hand = [];
        this.tomb = [];
        this.enemies = ENEMIES.map(m => new Enemy(m));
        this.shuffle();
        this.startTurn();
    }

    shuffle() { this.deck.sort(() => Math.random() - 0.5); }

    log(msg) {
        const l = document.getElementById('log');
        l.innerHTML = msg + "<br>" + l.innerHTML;
    }

    draw(count) {

        for (var idx = 0 ; idx < count; ++idx) {
            if (this.deck.length === 0) {
                if (this.tomb.length === 0) return;
                this.deck = [...this.tomb];
                this.tomb = [];
                this.shuffle();
                this.log("Deck reshuffled.");
            }

            const card = this.deck.pop();
            setTimeout(() =>
                card.flyTo(this.mDeck.getBoundingClientRect(),
                    this.mHand.getBoundingClientRect(),
                    () => {
                        this.hand.push(card);
                        this.render();
                    }), idx * 60);;
        }
    }


    playCard(card, uipos, target = null) {
        // const card = this.hand[cardIndex]

        // var card = this.pendingCard;

        console.log(`playing ${card.name}`);
        // Basic checks
        if (this.player.ap < card.cost) return;

        // Execute Attack
        if (card.type === 'attack') {
            if (card.area) {
                this.enemies.forEach(e => e.dealDamage(card.damage));
            } else {
                if (target !== null) {
                    target.dealDamage(card.damage);
                } else {
                    console.log(`card need target`);
                    return ;
                }
            }
        } else {
            if (card.effect === 'gainAP') this.player.ap += card.value;
            if (card.effect === 'draw') this.draw(card.value);
        }

        // Cleanup
        this.player.ap -= card.cost;
        this.hand = this.hand.filter(c => (c != card));
        card.flyTo({
                "left": uipos.x,
                "top": uipos.y,
                "width": 145,
                "height": 184,
            },
            this.mTomb.getBoundingClientRect(),
            () => {
                this.tomb.push(card);
                this.processMoves();
                this.render();
            });
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
    setMzoneTargetable(targetable, card) {
        this.mZone.ondragover = targetable? (e) => {
            console.log("onDrag over");
            e.preventDefault();
        }: null;
        this.mZone.ondrop = targetable? (e) => {
            console.log("onDrag over panel");
            e.preventDefault();
            this.playCard(card, {
                "x": e.clientX,
                "y": e.clientY,
            });
        }: null;
    };
    targetSelect(card) {
        this.setMzoneTargetable(!card.requireTarget, card);
        this.enemies.forEach(e => e.setTargetable(card.requireTarget, card));
    }

    // --- 5. UI Rendering ---
    render() {
        // Stats
        // document.getElementById('player-hp').innerText = this.player.hp;
        // document.getElementById('player-ap').innerText = this.player.ap;
        document.getElementById('pile-counts').innerText = `Deck: ${this.deck.length} | Tomb: ${this.tomb.length}`;
        this.player.updateAp();

        // Enemies
        this.mZone.replaceChildren(...this.enemies.map(
            enemy => enemy.createElement()));

        const count = this.hand.length;
        var i =  (count - 1) / -2;
        const radius = 140 + count * 6;
        const spread = Math.min(14, 60 / count);
        this.mHand.replaceChildren(...this.hand.map(
            card => {
                const div = card.createElement();
                const canplay = this.player.ap >= card.cost;
                div.classList.add("hand");
                div.style.setProperty("--i", i);
                i += 1.0;
                div.style.setProperty("--spread", `${spread}deg`);
                div.style.setProperty("--radius", `${radius}px`);
                if (canplay) {
                    div.draggable = "true";
                    div.ondragstart = (e) => {
                        console.log(`startDrag ${e.target.id}`);
                        this.targetSelect(card);
                        // this.pendingCard = card;
                        div.classList.add("selected");
                    };
                    div.ondragend = (e) => {
                        console.log(`endDrag ${e.target.id}`);
                        // this.pendingCard = null;
                        div.classList.remove("selected");
                    };
                } else {
                    div.classList.add("disabled");
                }
                return div;
            }));
        var i =  this.tomb.length;
        this.mTomb.replaceChildren(...this.tomb.map(
            card => {
                const div = card.createElement();
                div.classList.add("stacked");
                div.style.setProperty("--i", --i);
                // div.style.transform += ` rotate(${(Math.random() - 0.5) * 4}deg)`;
                return div;
            }
            ));
        var i =  this.deck.length;
        this.mDeck.replaceChildren(...this.deck.map(
            card => {
                const div = document.createElement("div");
                div.classList.add("card", "back", "stacked");
                div.style.setProperty("--i", --i);
                // div.style.transform += ` rotate(${(Math.random() - 0.5) * 4}deg)`;
                return div;
            }
            ));
    }
    handleEndTurn() {
        // Monsters that didn't act yet act now
        this.enemies.forEach(e => e.eof(this.player));
        for (var idx = 0; idx < this.hand.length; ++idx) {
            setTimeout(() => {
                const card = this.hand.pop();
                card.flyTo(card.div.getBoundingClientRect(),
                    this.mTomb.getBoundingClientRect(),
                    () => {
                        this.tomb.push(card);
                        this.render();
                    });
                }, idx * 60);
        }
        this.startTurn();
    }
}

function startGame() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    game = new CardGame(deck);
}

let deck = [
];

for (i = 0; i < 14; ++i) deck.push(new Card(CARD_LIBRARY[Math.floor(Math.random() * CARD_LIBRARY.length)]));

initSetup();
