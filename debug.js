import sqlite3 from "sqlite3";
require("dotenv").config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_DEBUGCHAT = process.env.TELEGRAM_DEBUGCHAT;
function URIEncode(text) {
	let encodedText = "";
	for (let char of text) {
		if (/^[a-zA-Z0-9]+$/.test(char)) {
			encodedText += char;
			continue;
		}
		let code = char.charCodeAt(0).toString(16);
		if (code.length === 1) { code = "0" + code; }
		encodedText += "%" + code;
	}
	return encodedText;
}
let message = (process.argv.length > 2)?process.argv.slice(2).join(" "):"Hello, World!";
message = URIEncode(message);
const URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${TELEGRAM_DEBUGCHAT}&text=${message}`;
console.log(URL);

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