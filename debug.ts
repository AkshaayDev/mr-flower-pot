import sqlite3 from "sqlite3";
require("dotenv").config();

let message: string = process.argv.slice(2).join(" ");
message = (process.argv.length > 2)?message:"Hello World";
message = encodeURI(message);
console.log(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=${process.env.TELEGRAM_DEBUGCHAT}&text=${message}`);

function read(path: string) {
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