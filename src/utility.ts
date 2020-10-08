import _ from "underscore";
import jinja from "jinja-js";
import { promises as fs } from "fs";

interface Banlist {
	name: string
	list: number[][]
}

export async function generateBanlistFromCode(banlists: Banlist[]) {
	const template = await fs.readFile("./templates/lflist.conf.j2", "utf-8");
	return jinja.render(template, { banlists });
}
