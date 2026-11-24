
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
let MAX_SIZE = 15;

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
    constructor(temp, scene) {
        for(var c in temp) {
            // console.log(k);
            this[c]=temp[c];
        }
        this.hpbar = new HPbar(this.hp);

        const hpdiv = this.hpbar.createElement();
        hpdiv.style.marginLeft = 'auto';
        hpdiv.style.marginRight = 'auto';

        const div = document.createElement("div");
        div.classList.add("monster");
        // div.dataset.cardId = this.id;

        const name = document.createElement("span");
        name.innerText = this.name;
        this.counterView = document.createElement("span");
        this.counterView.classList.add("monster-counter");

        var sprite = new Image(180, 240);
        sprite.src = `./assets/mobs/${this.name}.jpeg`;
        sprite.setAttribute("loading", "lazy");
        div.append(name,
            this.counterView,
            document.createElement("br"),
            hpdiv,
            document.createElement("br"),
            sprite);

        this.element = div;
        this.scene = scene;
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
            this.scene.playCard(card, {
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
    // this function is async
function flyTo(clone, from, end, onfinish = null) {
    clone.style.position = "fixed";
    clone.style.left = `${from.left}px`;
    clone.style.top = `${from.top}px`;
    clone.style.margin = "0";
    clone.style.pointerEvents = "none";
    clone.style.zIndex = "9999";
    clone.classList.add("flying-card");

    document.body.appendChild(clone);

    const dx = end.left - (from.left);
    const dy = end.top - (from.top);

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


class Card {
    constructor(temp) {
        for(var k in temp) {
            // console.log(k);
            this[k]=temp[k];
        }
        /*
        const div = document.createElement("div");
        div.classList.add("card", this.type);
        const topbar = document.createElement("div");
        topbar.classList.add("topbar");

        const title = document.createElement("b");
        title.textContent = this.name;

        const cost = document.createElement("b");
        cost.textContent = this.cost;
        cost.style.marginLeft = 'auto';

        topbar.append(title, cost);

        const desc = document.createElement("small");
        desc.textContent = this.desc;

        div.append(topbar, document.createElement("br"), desc);

        div.style.backgroundImage = `url('./assets/cards/${this.name}.jpeg')`;
        div.style.backgroundSize = "cover";
        this.element = div; */
        this.element = el('div', {class: `card ${this.type}`},
                el('div', {class: "topbar"}, 
                    el('b', {}, this.name),
                    el('b', {}, this.cost),
                ),
                el('br'),
                el('small', {}, this.desc),
            );
    }

    createElement() {
        // return this.element;
        this.div = this.element.cloneNode(true);
        return this.div;
    }
}


class CombatPlayer {
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
function process(obj, evt) {
    if (Object.hasOwn(obj, evt.what))
        obj.what(evt);
    if (Object.hasOwn("evChildren"))
        obj.evChildren.forEach(c => process(c, evt));
}

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);

  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "style") Object.assign(node.style, v);
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node[k] = v;
  }

  for (const child of children) {
    if (child == null) continue;
    node.append(child.nodeType ? child : document.createTextNode(child));
  }

  return node;
}

class SetupScene {
    
    countSpan = el("span", { id: "count", textContent: "0" });
    
    startBtn = el("button", {
            id: "start-btn",
            class: "end-turn",
            style: { marginTop: "20px", display: "none" },
            }, "Start Game");
            
    prev = el("div", { id: "deck-preview", class: "flex y-mandatory" });
    tempToDiv(temp) {
        const card = new Card(temp);
        const cdiv = card.createElement();
        cdiv.onclick = () => {
                if (this.deck.length == MAX_SIZE) return ;
                this.deck.push(new Card(temp));
                this.render();
            }; // onclick
        return cdiv;
    }
    
    createElement() {
        const cardCandidates = [...CARD_LIBRARY.map(c => this.tempToDiv(c))];

        return el("div", {},
            el("h2", {}, "Build Your Deck (Select cards)"),
            el("div", { id: "library-zone", class: "flex y-mandatory"}, ...cardCandidates),
            el("p", {},
              "Selected: ",
              this.countSpan,
              "/",
              el("span", { id: "max_cards", textContent: "15" })
            ),
            this.prev,
            this.startBtn
        );
    }
    
    enter(d) {
        this.deck = d.deck;
        this.startBtn.onclick = () => game.sm.push(scenes.combat, d);
        for (var i = 0; i < 14; ++i) 
            this.deck.push(new Card(CARD_LIBRARY[Math.floor(Math.random() * CARD_LIBRARY.length)]));
        this.render();

    }
    
    render() {
        this.countSpan.innerText = this.deck.length;
        this.prev.replaceChildren(
            ...this.deck.map(c => c.createElement()));
        if (this.deck.length == MAX_SIZE) {
            this.startBtn.style.display = 'block';
        }
    }
}
class RewardOverlay {
  createElement() {
    this.el = document.createElement("div");

    const blocker = document.createElement("div");
    blocker.className = "input-blocker";

    const panel = document.createElement("div");
    panel.className = "overlay-panel";

    this.el.append(blocker, panel);
    return this.el;
  }
}
// --- 4. Core Game Engine ---
class CombatScene {
    hand = [];
    tomb = [];
    mTomb = el("div", { id: "tomb-zone" });
    mDeck = el("div", { id: "deck-zone" });
    mHand = el("div", { id: "hand-zone" });
    mZone = el("div", {
          id: "monster-zone",
          class: "flex zone",
          style: { alignItems: "right" }
        });
    createElement() {
        this.enemies = ENEMIES.map(m => new Enemy(m, this));
        return el("div", { class: "scene combat-scene" },
            this.mZone,
            el("div", { class: "flex", style: { 
                justifyContent: "space-around", width: "100%" } },
              this.mDeck,
              this.mHand,
              this.mTomb
            ),
            el("div", { style: {transform: "translateY(-100px)"} },
                el("div", {
                  style: {
                    display: "flex",
                    justifyContent: "space-around",
                    alignItems: "center",
                  }
                },
                  el("div", { id: "pile-counts" }, "Deck: 0 | Tomb: 0"),
                  el("div", { id: "stat-bar", class: "stat-bar" }),
                  el("button", {
                    class: "end-turn",
                    onclick: () => this.handleEndTurn()
                  }, "END TURN")
                ),
                el("div", { id: "log" }, "Welcome to the dungeon...")
            ));
    }
    
    enter(d) {
        this.deck = d.deck;
        this.player = new CombatPlayer(d.player.hp, d.player.ap);
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
                flyTo(card.createElement(), 
                    this.mDeck.getBoundingClientRect(),
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
        flyTo(card.createElement(),
            {
                "left": uipos.x,
                "top": uipos.y,
                "width": this.mTomb.style.width,
                "height": this.mTomb.style.height,
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
        if (this.enemies.length === 0) this.showSummary("Victory!");
        if (this.player.hp <= 0) this.showSummary("Game Over!");
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
                        div.classList.add("selected");
                    };
                    div.ondragend = (e) => {
                        console.log(`endDrag ${e.target.id}`);
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
                flyTo(card.createElement(), 
                    card.div.getBoundingClientRect(),
                    this.mTomb.getBoundingClientRect(),
                    () => {
                        this.tomb.push(card);
                        this.render();
                    });
                }, idx * 60);
        }
        this.startTurn();
    }
    
    showSummary(summary) {
        
    }
}
let deck = [
];


const scenes = {
  // choose difficulty
  // menu: new MapScene(),
  // player build initial deck.
  setup: new SetupScene(),
  map: new MapScene(),
  combat: new CombatScene(),
  // reward: new RewardScene(),
  // store: new RewardScene(),
  // event: new RewardScene(),
};


class GamePlay {
    constructor() {
        this.sm = new SceneManager();
        this.player = {hp: 50, ap: 3};
        this.deck = [];

    }
    // --- 3. Deck Building Logic ---
    initSetup() {
        this.sm.push(scenes.setup, this);
    }
}

let game = new GamePlay();
game.initSetup();
