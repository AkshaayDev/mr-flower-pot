import { Telegraf } from "telegraf";
import { OpenAI } from "openai";
import sqlite3 from "sqlite3";
require("dotenv").config();

type commandType = { description: string, formats: string[] };
type messageType = { author: string, content: string, channelID: string };
type database = sqlite3.Database;

const db: database = new sqlite3.Database("./telegram.sqlite");
db.serialize(() => { db.run(`
CREATE TABLE IF NOT EXISTS messages (
	author TEXT,
	content TEXT,
	channelID TEXT
)
`); });
const TELEGRAM_TOKEN: string = process.env.TELEGRAM_TOKEN!;
const OPENAI_APIKEY: string = process.env.OPENAI_APIKEY!;
const OPENAI: any = new OpenAI({ apiKey: OPENAI_APIKEY });
const bot: any = new Telegraf(TELEGRAM_TOKEN);
const CMDLIST: { [name: string]: commandType } = {
	"ChatGPT Conversation": {
		description: "Have a conversation with ChatGPT.",
		formats: ["chat <message>"]
	},
	"Conversation Refresh": {
		description: "Refresh the ChatGPT conversation.",
		formats: ["chatrefresh","chatr"]
	},
	"DALL-E": {
		description: "Generate an image using DALL-E.",
		formats: ["dalle <prompt>","imagine <prompt>"]
	},
	"Say/Repeat": {
		description: "Repeat the message given.",
		formats: ["say <message>","repeat <message>"]
	},
	"Coin Flip": {
		description: "Randomly returns heads or tails.",
		formats: ["coin","flip"]
	},
	"Dice Roll": {
		description: "Returns a random number from 1 to 6.",
		formats: ["dice","roll"]
	},
};
const CONTEXT: string = "Your name is Mr. Flower Pot, a telegram chatbot. "+
"You are not actually about flowers or gardening.";

function getMessagesByChannelID(db: database, channelID: string): Promise<messageType[]> {
	return new Promise<messageType[]>((resolve: any, reject: any) => {
		db.all("SELECT * FROM messages WHERE channelID = ?", [channelID], (err: Error|null, rows: any[]) => {
			if (err) { reject(err); } else { resolve(rows); }
	  	});
	});
}
function insertMessage(db: database, author: string, content: string, channelID: string): void {
	db.serialize(() => {
		db.run("INSERT INTO messages (Author, Content, ChannelID) VALUES (?, ?, ?)",
		[author, content, channelID], (err: Error|null) => {if (err) { console.error(err.message); }});
	});
}
function clearChat(db: database, channelID: string): void {
	db.serialize(() => {
		db.run("DELETE FROM messages WHERE channelID = ?", [channelID], (err: Error|null) => {
			if (err) { console.error(err.message); }
		});
	});
}
async function chatgptConversation(channelID: string): Promise<string> {
	let messages: any = await getMessagesByChannelID(db, channelID);
	messages.forEach((message: messageType) => {
		if (!["system", "assistant", "function"].includes(message.author)) {
			message.author = "user";
		}
	});
	messages.unshift({ author: "system", content: CONTEXT, channelID: channelID });
	const response: any = await OPENAI.chat.completions.create({
		model: "gpt-3.5-turbo",
		messages: messages.map((message: messageType) => ({ role: message.author, content: message.content })),
	});
	return response.choices[0].message.content;
}
async function dalle(prompt: string): Promise<string> {
	const img: any = await OPENAI.images.generate({
		model: "dall-e-2",
		prompt: prompt,
		n: 1,
		size: "1024x1024",
	});
	return img.data[0].url;
}
function choice(array: any[]): any {
	return array[Math.floor(Math.random() * array.length)];
}
function randInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

let slashCommands = ["start", "help", "debug"];
for (const cmdname of Object.keys(CMDLIST)) {
	const cmdobj: commandType = CMDLIST[cmdname];
	const formatlist: string[] = cmdobj.formats.slice();
	formatlist.forEach((format) => {
		slashCommands.push(format.split(" ")[0]);
	})
}
bot.command(slashCommands, async (message: any) => {
	try {
		const ARGS: string[] = message.message.text.slice(1).trim().split(" ");
		const CMD: string = ARGS.shift()!.toLowerCase();
		message.sendChatAction("typing");
		switch (CMD) {
			case "chat":
				if (ARGS.length === 0) {
					message.reply("You did not send a message - cancelling command.");
					return;
				}
				insertMessage(db, message.message.from.username, ARGS.join(" "), message.chat.id.toString());
				const response: string = await chatgptConversation(message.chat.id.toString());
				insertMessage(db, "assistant", response, message.chat.id.toString());
				if(response === null || response === "") {
					message.reply("⠀");
				} else {
					message.replyWithMarkdown(response);
				}
				break;
			case "chatrefresh":
			case "chatr":
				clearChat(db, message.chat.id.toString());
				message.reply("Conversation refreshed.");
				break;
			case "dalle":
			case "imagine":
				if (ARGS.length == 0) {
					message.reply("You did not send a prompt - cancelling command.");
					return;
				}
				const url: string = await dalle(ARGS.join(" "));
				message.replyWithPhoto({ url: url }, { caption: ARGS.join(" ") });
				break;
			case "say":
			case "repeat":
				if (ARGS.length === 0) message.reply("You did not send a message to repeat - cancelling command.");
				else await message.reply(ARGS.join(" "));
				break;
			case "coin":
			case "flip":
				message.replyWithMarkdown(`You landed *${choice(["heads", "tails"])}*!`);
				break;
			case "dice":
			case "roll":
				message.replyWithMarkdown(`You rolled a *${randInt(1, 6)}*!`);
				break;
			case "debug":
				message.reply(JSON.stringify(message.update, null, 4));
				break;
			case "start":
			case "help":
				let text: string = "*HELP MENU*\n\n";
				for (const cmdname of Object.keys(CMDLIST)) {
					const cmdobj: commandType = CMDLIST[cmdname];
					const description: string = cmdobj.description;
					text += `*${cmdname}*:\n${description}\n`;
					const formatlist: string[] = cmdobj.formats.slice();
					for (let i = 0; i < formatlist.length; i++) {
						formatlist[i] = `/${formatlist[i]}`;
					}
					text += `\`${formatlist.join("\n")}\`\n\n`;
				}
				message.replyWithMarkdown(text);
				break;
		}
	} catch(err: any) {
		if (err.message.startsWith("400 Your request was rejected")){
			message.reply("Your request was rejected as it is not allowed by our safety system.");
		}
		else if (err.message.startsWith("400 This model's maximum context length is 16385 tokens.")) {
			message.replyWithMarkdown("Conversation character length exceeded maximum limit of 16385. "+
				"Please refresh the conversation by typing `/chatr`."
			);
		}
		else if (err.message.startsWith("429 Rate limit reached for gpt-3.5-turbo")) {
			const TIMEOUTID = "Please try again in ";
			const TIMEPERIOD = (err.message.includes("RPM"))?"minute":"day";
			let timeoutStart = err.message.indexOf(TIMEOUTID) + TIMEOUTID.length;
			let timeoutEnd = err.message.indexOf(".", timeoutStart);
			const TIMEOUT = err.message.slice(timeoutStart, timeoutEnd);
			message.reply(`Requests per ${TIMEPERIOD} limit reached - please wait for ${TIMEOUT}.`);
		}
		else if (err.message.startsWith("400 Sorry! We've encountered an issue with repetitive patterns")) {
			message.reply("Repetitive patterns found in your prompt. Please try again with a different prompt.");
		}
		else if (err.message.startsWith("429 You exceeded your current quota")) {
			message.reply("AI quota exceeded.");
		}
		else if (err.message === "400 Billing hard limit has been reached") {
			message.reply("AI billing hard limit has been reached.")
		}
		else {
			message.reply(`Unhandled error: ${err.message}`);
		}
		console.error(err);
	}
})
bot.launch();
