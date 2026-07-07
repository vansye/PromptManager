import { describe, it, expect } from 'vitest';

describe('db', () => {
	it('should export db instance', async () => {
		const { db } = await import('../db');
		expect(db).toBeDefined();
		expect(db.name).toBe('PromotHeroDB');
	});

	it('should have prompts table', async () => {
		const { db } = await import('../db');
		expect(db.tables.length).toBe(1);
		expect(db.tables[0].name).toBe('prompts');
	});
});
