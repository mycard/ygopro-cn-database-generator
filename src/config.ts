import fs from "fs";
import yaml from "yaml";

export interface Config {
	postDepth: number;
	jpDatabasePath: string;
	cnDatabasePath: string;
	outputPath: string;
}

export async function loadConfig(): Promise<Config> {
	return yaml.parse(await fs.promises.readFile("./config.yaml", "utf-8"));
}
