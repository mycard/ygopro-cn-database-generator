import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";
import _ from "underscore";
import Base from "./base";
import { promises as fs } from "fs";

export class DBReader extends Base {
	jpdb: Database;
	cndb: Database;
	outputdb: Database;
	private async openDatabase(path: string) {
		return await open({
			filename: path,
			driver: sqlite3.Database
		});
	}
	async init() {
		await super.init();
		this.log.debug(`Opening databases...`);
		this.cndb = await this.openDatabase(this.config.cnDatabasePath);
		this.jpdb = await this.openDatabase(this.config.jpDatabasePath);
	}
	private async openOutputDatabase() {
		try {
			await fs.access(this.config.outputPath);
		} catch (e) {
			await fs.mkdir(this.config.outputPath, { recursive: true });
		}
		this.outputdb = await this.openDatabase(this.config.outputPath);
	}
	async getCodeFromJapaneseName(name: string): Promise<number[]> {
		this.log.debug(`Reading JP database for code of name ${name}.`);
		const output = await this.jpdb.get('SELECT id FROM texts WHERE name = ?', name);
		if (!output) {
			this.log.debug(`Code of ${name} not found.`);
			return [];
		}
		const code: number = output.id;
		this.log.debug(`Reading CN database for more codes of id ${code}.`);
		const moreCodes: number[] = (await this.cndb.all('SELECT id FROM datas WHERE id >= ? AND id <= ?', [code, code + 10])).map(m => m.id);
		this.log.debug(`${name} => ${moreCodes.join(",")}`);
		return moreCodes;
	}
	async getAllCodesFromJapaneseNames(names: string[]): Promise<number[]> {
		const codes = _.flatten(await Promise.all(names.map(s => this.getCodeFromJapaneseName(s))), true);
		return _.uniq(codes);
	}
}
