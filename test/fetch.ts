import { CNFetcher } from "../src/fetcher";

async function main() {
	const fetcher = new CNFetcher({ name: "Test fetch", level: "debug" });
	await fetcher.init();
	const strings = await fetcher.fetch();
	console.log(strings);
	process.exit();
}
main();
