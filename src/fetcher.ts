

import axios from "axios";
import _ from "underscore";
import Base from "./base";


function convertCharToFullSize(char: string) {
	const charCode = char.charCodeAt(0);
	if (charCode !== 32 && charCode < 127) {
		return String.fromCharCode(charCode + 65248);
	} 
	return char;
}

export class CNFetcher extends Base {
	private async fetchPage(url: string): Promise<string> {
		this.log.debug(`Downloading content from ${url} .`);
		const { data } = await axios.get(url, {
			responseType: "document"
		});
		this.log.debug(`Downloaded content from ${url} .`);
		return data;
	}
	async getAllStrings(url: string): Promise<string[]> {
		const data = await this.fetchPage(url);
		const allStrings: string[] = data.match(/<font color="Silver">\u203b(.*)<\/font><br \/>/g);
		if (!allStrings) {
			return [];
		}
		const allCardNames = allStrings.map(m => m.match(/<font color="Silver">\u203b(.*)<\/font><br \/>/)[1]);
		const uniqueCardNames = _.uniq(allCardNames).map(m => Array.from(m).map(convertCharToFullSize).join(""));
		this.log.debug(`${uniqueCardNames.length} cards found from ${url} .`);
		return uniqueCardNames;
	}
	async fetchPosts(): Promise<string[]> {
		let posts: string[] = [];
		for (let i = 1; i <= this.config.postDepth; ++i) {
			const url = `https://bbs.newwise.com/forum-8-${i}.html`;
			this.log.debug(`Fetching pages from ${url} .`);
			const content = await this.fetchPage(url);
			const contentMatches: string[] = content.match(/<a href="([^"]+)" [^>]*>【简体中文版】[^<]*<\/a>/g);
			if (!contentMatches) {
				this.log.debug(`No pages found from ${url} .`);
				continue;
			}
			const postsFound = contentMatches.map(m => m.match(/<a href="([^"]+)" [^>]*>【简体中文版】[^<]*<\/a>/)[1]);
			this.log.debug(`Got ${postsFound} pages from ${url} .`);
			posts = posts.concat(postsFound);
		}
		return posts;
	}
	async fetch(): Promise<string[]> {
		this.log.debug(`Started fetching...`);
		const posts = await this.fetchPosts();
		const strings = _.flatten(await Promise.all(posts.map(m => this.getAllStrings(m))), true);
		this.log.debug(`Done.`);
		return _.uniq(strings);
	}
}
