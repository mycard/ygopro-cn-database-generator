import { DBReader } from "../src/dbreader";
import { CNFetcher } from "../src/fetcher";
import _ from "underscore";

async function main() {
	const fetcher = new CNFetcher({ name: "Test fetch", level: "debug" });
	await fetcher.init();
	const dbreader = new DBReader({ name: "Test database", level: "debug" });
	await dbreader.init();
	const strings = await fetcher.fetch();
	await dbreader.run(strings);
	process.exit();
}
main();
