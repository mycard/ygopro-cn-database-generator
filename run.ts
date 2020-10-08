import { DBReader } from "./src/dbreader";
import { CNFetcher } from "./src/fetcher";
import _ from "underscore";

async function main() {
	const fetcher = new CNFetcher({ name: "Fetcher", level: "debug" });
	await fetcher.init();
	const dbreader = new DBReader({ name: "Database", level: "debug" });
	await dbreader.init();
	const strings = await fetcher.fetch();
	await dbreader.run(strings);
	process.exit();
}
main();
