import fs from "node:fs";
import sqlite3 from "sqlite3";

function read(path: string) {
	if (!fs.existsSync(path)) {
		console.log(`File "${path}" does not exist.`);
		return;
	}
	const db: sqlite3.Database = new sqlite3.Database(path);
	db.serialize(() => { db.run(`
	CREATE TABLE IF NOT EXISTS messages (
		author TEXT,
		content TEXT,
		channelID TEXT
	)
	`); });
	new Promise((resolve: any, reject: any) => {
		db.all("SELECT * FROM messages", (err: Error|null, rows: any[]) => {
			if (err) { reject(err); } else { resolve(rows); }
		});
	}).then(console.log);
}
read("./telegram.sqlite");
read("./discord.sqlite");
