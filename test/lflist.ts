import { generateBanlistFromCode } from "../src/utility";

const banlists = [
	{
		name: "test1",
		list: [
			[111, 222, 333],
			[444, 555, 666],
			[777, 888, 999]
		]
	},
	{
		name: "test2",
		list: [
			[111, 222, 333],
			[444, 555, 666],
			[777, 888, 9999]
		]
	}
]

async function main() {
	const listText = await generateBanlistFromCode(banlists);
	console.log(listText);
}
main();
