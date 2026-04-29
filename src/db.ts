import Dexie, { Table } from 'dexie';

export interface Prompt {
	id?: number;
	title: string;
	content: string;
	tags: string[];
	updatedAt: Date;
}

export class PromotHeroDB extends Dexie {
	prompts!: Table<Prompt, number>;

	constructor() {
		super('PromotHeroDB');
		this.version(1).stores({
			prompts: '++id,title,updatedAt'
		});
		this.version(2).stores({
			prompts: '++id,title,tags,updatedAt'
		});
	}
}

export const db = new PromotHeroDB();

export default db;
