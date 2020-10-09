import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";
import _ from "underscore";
import Base from "./base";
import { promises as fs } from "fs";
import { generateBanlistFromCode } from "./utility";
import { Cards, DeckGenerator } from "./deck";

const textsFields = ["id", "name", "desc"]
for (let i = 1; i <= 16; ++i) {
	textsFields.push(`str${i}`);
}
const datasFields = ["id", "ot", "alias", "setcode", "type", "atk", "def", "level", "race", "attribute", "category"];

class SQLQuery {
	sql: string;
	values: any[];
	constructor(sql: string, values: any[]) {
		this.sql = sql;
		this.values = values;
	}
	async perform(db: Database) {
		await db.run(this.sql, this.values);
	}
}

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
	async finalize() {
		await this.cndb.close();
		await this.jpdb.close();
		if (this.outputdb) {
			await this.outputdb.close();
		}
	}
	private async openOutputDatabase() {
		const fullPath = `${this.config.outputPath}/cn.cdb`;
		const createDirectoryPath = `${this.config.outputPath}/deck/cn`;
		try {
			await fs.access(createDirectoryPath);
		} catch (e) {
			this.log.debug(`Creating directory ${createDirectoryPath} ...`);
			await fs.mkdir(createDirectoryPath, { recursive: true });
		}
		try {
			await fs.unlink(fullPath);
		} catch (e) { }
		this.log.debug(`Creating database ${fullPath} ...`);
		this.outputdb = await this.openDatabase(fullPath);
		const initSQLs = [
			"PRAGMA foreign_keys=OFF;",
			"BEGIN TRANSACTION;",
			"CREATE TABLE texts(id integer primary key,name text,desc text,str1 text,str2 text,str3 text,str4 text,str5 text,str6 text,str7 text,str8 text,str9 text,str10 text,str11 text,str12 text,str13 text,str14 text,str15 text,str16 text);",
			"CREATE TABLE datas(id integer primary key,ot integer,alias integer,setcode integer,type integer,atk integer,def integer,level integer,race integer,attribute integer,category integer);",
			"COMMIT;"
		];
		for (let sql of initSQLs) {
			await this.outputdb.run(sql);
		}
	}
	async getCodeFromJapaneseName(name: string): Promise<number> {
		this.log.debug(`Reading JP database for code of name ${name}.`);
		const output = await this.jpdb.get('SELECT id FROM texts WHERE name = ?', name);
		if (!output) {
			this.log.debug(`Code of ${name} not found.`);
			return 0;
		}
		const code: number = output.id;
		return code;
	}
	async getExtendedCodeFromJapaneseName(name: string): Promise<number[]> {
		const code: number = await this.getCodeFromJapaneseName(name);
		if (!code) {
			return [];
		}
		this.log.debug(`Reading CN database for more codes of id ${code}.`);
		const moreCodes: number[] = (await this.cndb.all('SELECT id FROM datas WHERE id >= ? AND id <= ?', [code, code + 10])).map(m => m.id);
		this.log.debug(`${name} => ${moreCodes.join(",")}`);
		return moreCodes;
	}
	async getAllPureCodesFromJapaneseNames(names: string[]): Promise<number[]> {
		const codes = await Promise.all(names.map(s => this.getCodeFromJapaneseName(s)));
		return _.uniq(codes);
	}
	async getAllCodesFromJapaneseNames(names: string[]): Promise<number[]> {
		const codes = _.flatten(await Promise.all(names.map(s => this.getExtendedCodeFromJapaneseName(s))), true);
		return _.uniq(codes);
	}
	private getDatasArray(datas: any): any[] {
		const ret = [];
		for (let field of datasFields) {
			ret.push(datas[field]);
		}
		return ret;
	}
	private getTextsArray(texts: any): any[] {
		const ret = [];
		for (let field of textsFields) {
			ret.push(texts[field]);
		}
		return ret;
	}
	async getQueriesFromCode(code: number): Promise<SQLQuery[]> {
		this.log.debug(`Reading card ${code}.`);
		const datas = await this.cndb.get("select * from datas where id = ?", [code]);
		const texts = await this.cndb.get("select * from texts where id = ?", [code]);
    texts.desc += '\r\n\r\n\u2605简体中文卡';
		const datasArray = this.getDatasArray(datas);
		const textsArray = this.getTextsArray(texts);
		return [
			new SQLQuery(`INSERT INTO texts VALUES(${_.range(textsArray.length).map(m => "?")});`, textsArray),
			new SQLQuery(`INSERT INTO datas VALUES(${_.range(datasArray.length).map(m => "?")});`, datasArray)
		]
	}
	async getAllQueries(codes: number[]): Promise<SQLQuery[]> {
		const queries = _.flatten(await Promise.all(codes.map(s => this.getQueriesFromCode(s))), true);
		return queries;
	}
	async getOtherCardCodes(cnCodes: number[]) {
		const sql = `SELECT id FROM datas WHERE 1 AND ${cnCodes.map(m => "id != ?").join(" AND ")}`;
		const otherCodes: number[] = (await this.cndb.all(sql, cnCodes)).map(m => m.id);
		return otherCodes;
	}
	async generateBanlist(codes: number[]) {
		const otherCodes = await this.getOtherCardCodes(codes);
		const banlistString = await generateBanlistFromCode([
			{
				name: "cn",
				list: [
					otherCodes
				]
			}
		]);
		await fs.writeFile(`${this.config.outputPath}/lflist.conf`, banlistString);
	}
	private async checkExtraDeckCards(code: number) {
		const sql = `select id from datas where type & (0x4000000 | 0x800000 | 0x2000 | 0x40) > 0 AND id = ?`;
		const result = (await this.cndb.all(sql, [code]));
		return result.length > 0;
	}
	private async checkMainDeckCards(code: number) {
		const sql = `select id from datas where type & (0x4000000 | 0x800000 | 0x4000 | 0x2000 | 0x40) == 0 AND id = ?`;
		const result = (await this.cndb.all(sql, [code]));
		return result.length > 0;
	}
	private async categorizeCards(codes: number[]): Promise<Cards> {
		const [mainResults, extraResults] = await Promise.all([
			Promise.all(codes.map(code => this.checkMainDeckCards(code))),
			Promise.all(codes.map(code => this.checkExtraDeckCards(code)))
		]);
		return {
			main: codes.filter((code, index) => mainResults[index]),
			extra: codes.filter((code, index) => extraResults[index])
		}
	}
	private async generateDecks(codes: number[]) {
		const cards = await this.categorizeCards(codes);
		const deckGenerator = new DeckGenerator(cards);
		const deckTexts = deckGenerator.getDeckTexts();
		await Promise.all(_.range(deckTexts.length).map(i => fs.writeFile(`${this.config.outputPath}/deck/cn/cn_${i}.ydk`, deckTexts[i])));
	}
	async run(strings: string[]) {
		const [codes, pureCodes] = await Promise.all([
			this.getAllCodesFromJapaneseNames(strings),
			this.getAllPureCodesFromJapaneseNames(strings)
		]);
		const queries = await this.getAllQueries(codes);
		await this.openOutputDatabase();
		await this.outputdb.run("BEGIN TRANSACTION;");
		for (let query of queries) {
			this.log.debug(`Writing database: ${query.sql} ${query.values.join(",")}`);
			await query.perform(this.outputdb);
		}
		await this.outputdb.run("COMMIT;");
		this.log.debug(`Database created.`);
		await this.generateBanlist(codes);
		this.log.debug(`LFList created.`);
		await this.generateDecks(pureCodes);
		this.log.debug(`Decks generated.`);
	}
}
