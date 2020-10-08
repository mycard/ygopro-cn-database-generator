import { DBReader } from "../src/dbreader";
import { CNFetcher } from "../src/fetcher";
import _ from "underscore";

async function main() {
	const fetcher = new CNFetcher({ name: "Test fetch", level: "debug" });
	await fetcher.init();
	const dbreader = new DBReader({ name: "Test database", level: "debug" });
	await dbreader.init();
	const strings = await fetcher.fetch();
	console.log(strings);
	const codes = _.flatten(await Promise.all(strings.map(s => dbreader.getCodeFromJapaneseName(s))), true);
	console.log(codes);
	process.exit();
}
main();
