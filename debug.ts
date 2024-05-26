import sqlite3 from "sqlite3";
require("dotenv").config();

function URIEncode(text: string) {
    let encoded = "";
    for (let char of text) {
        if (/^[a-zA-Z0-9]+$/i.test(char)) {
            encoded += char
            continue;
        }
        let code = char.charCodeAt(0).toString(16);
        if (code.length === 1) { code = "%0" + code; }
        else { code = "%" + code; }
        encoded += code;
    }
    return encoded;
}

let message: string = process.argv.slice(2).join(" ");
message = (process.argv.length > 2)?message:"Hello, World!";
message = URIEncode(message);
const URL = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=${process.env.TELEGRAM_DEBUGCHAT}&text=${message}`;
console.log(URL);
fetch(URL);

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