import _ from "underscore";
import { promises as fs } from "fs";

export interface Cards {
	main: number[],
	extra: number[]
}
export interface Deck extends Cards {
	side: number[]
}


export class DeckGenerator {
	cards: Cards;
	constructor(cards: Cards) {
		this.cards = cards;
	}
	private getExtraCardCountInSide() {
		if (!this.cards.main.length) {
			return 15;
		}
		if (!this.cards.extra.length) {
			return 0;
		}
		const mainExtraRatio = this.cards.main.length / this.cards.extra.length;
		const maxRatio = (60 + 15) / 15;
		const minRatio = 60 / (15 + 15);
		if (mainExtraRatio >= maxRatio) {
			return 0;
		}
		if (mainExtraRatio <= minRatio) {
			return 15;
		}
		const simplifiedRatio = (mainExtraRatio - minRatio) / (maxRatio - minRatio);
		return Math.ceil(15 * simplifiedRatio);
	}
	private splitCards(codes: number[], unit: number) {
		const count = Math.ceil(codes.length / unit);
		return _.range(count).map(i => {
			return codes.slice(i * unit, (i + 1) * unit);
		});
	}
	private getDeckString(deck: Deck) {
		const deckText = '#generated by ygopro-cn-database-generator\n#main\n' + deck.main.join('\n') + '\n#extra\n' + deck.extra.join('\n') + '\n!side\n' + deck.side.join('\n') + '\n';
		return deckText;
	}
	private getDeckFromPart(main: number[], extra: number[]) {
		const targetMain = main.slice(0, 60);
		const targetExtra = extra.slice(0, 15);
		const targetSide = main.slice(60).concat(extra.slice(15));
		return {
			main: targetMain,
			extra: targetExtra,
			side: targetSide
		}
	}
private getDecks() {
		const extraInSide = this.getExtraCardCountInSide();
		const mainInSide = 15 - extraInSide;
		const extraCount = 15 + extraInSide;
		const mainCount = 60 + mainInSide;
		const mainParts = this.splitCards(this.cards.main, mainCount);
		const extraParts = this.splitCards(this.cards.extra, extraCount);
		return _.range(Math.max(mainParts.length, extraParts.length)).map(i => this.getDeckFromPart(mainParts[i] || [], extraParts[i] || []));
	}
	getDeckTexts() {
		const decks = this.getDecks();
		return decks.map(d => this.getDeckString(d));
	}
}