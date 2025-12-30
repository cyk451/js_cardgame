class Handler {
    constructor(game) {
        this.ctx = game;
    }
    evt(what, card) {
        if (!Object.hasOwn(card, what)) return ;
        card[what].forEach(effect => this.effect(card, what, eff));
    }
    effect(card, what, eff) {
        switch (eff) {
            case "dmg_single":
            if (card.target == null) {
                console.log("internal error, missing target?");
            }
            card.target.hp -= eff.dmg;
            return;
            case "dmg_all":
            this.ctx.enemies.forEach(e => e.hp -= eff.dmg);
            return;
            case "ap_modify":
            this.ctx.player.ap += eff.amount;
            return;
            case "draw":
            for (let i = 0; i < count; i++) {
                if (this.ctx.deck.length === 0) {
                    this.ctx.deck = [...this.ctx.tomb];
                    this.ctx.tomb = [];
                    this.ctx.shuffle();
                }
                this.ctx.hand.push(this.ctx.deck.pop());
                this.ondraw();
            }
            return;
            case "play_a_card":
            return;
            case "spawn_card":
            return;
            case "volatile":
            return ;
            case "reserve":
            return ;
        }
    }
}
