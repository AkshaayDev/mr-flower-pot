import { Database } from "bun:sqlite";

async function read(path: string) {
	if (!await Bun.file(path).exists()) {
		console.log(`File "${path}" does not exist.`);
		return;
	}
	const db: Database = new Database(path);
	db.query(`
	CREATE TABLE IF NOT EXISTS messages (
		author TEXT,
		content TEXT,
		channelID TEXT
	)
	`).run();
	console.log(db.query(`SELECT * FROM messages`).all());
}
read("./telegram.sqlite");
read("./discord.sqlite");
