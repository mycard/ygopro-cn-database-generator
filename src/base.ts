import { Config, loadConfig } from "./config";
import bunyan from "bunyan";
import _ from "underscore";

export default abstract class Base {
	config: Config;
	log: bunyan;
	constructor(loggerOptions: bunyan.LoggerOptions) {
		this.log = bunyan.createLogger(loggerOptions);
	}
	protected async loadConfig() {
		this.config = await loadConfig();
	}
	async init() {
		this.log.debug("Reading config...");
		await this.loadConfig();
	}
	async finalize() {
		// for override
	}
}
