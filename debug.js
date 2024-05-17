import sqlite3 from "sqlite3";
require("dotenv").config();

const message = encodeURI("Hello, World!");
console.log(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=${process.env.TELEGRAM_DEBUGCHAT}&text=${message}`);

function read(path) {
	const db = new sqlite3.Database(path);
	db.serialize(() => { db.run(`
	CREATE TABLE IF NOT EXISTS messages (
		author TEXT,
		content TEXT,
		channelID TEXT
	)
	`); });
	new Promise((resolve, reject) => {
		db.all("SELECT * FROM messages", (err, rows) => {
			if (err) { reject(err); } else { resolve(rows); }
  		});
	}).then(console.log);
}
read("./telegram.sqlite");
read("./discord.sqlite");