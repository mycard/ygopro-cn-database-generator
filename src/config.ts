import fs from "fs";
import yaml from "yaml";

export interface Config {
	postDepth: number;
	jpDatabasePath: string;
	cnDatabasePath: string;
	outputPath: string;
}

export async function loadConfig(): Promise<Config> {
	// return yaml.parse(await fs.promises.readFile("./config.yaml", "utf-8"));
	return {
		postDepth: process.env.POST_DEPTH ? parseInt(process.env.POST_DEPTH) : 5,
		jpDatabasePath: process.env.JP_DATABASE_PATH || "./ygopro-database/locales/ja-JP/cards.cdb",
		cnDatabasePath: process.env.CN_DATABASE_PATH || "./ygopro-database/locales/zh-CN/cards.cdb",
		outputPath: process.env.OUTPUT_PATH || "./output"
	}
}
