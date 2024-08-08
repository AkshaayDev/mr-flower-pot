import { Client, GatewayIntentBits, ActivityType, EmbedBuilder } from "discord.js";
import { evaluate } from "mathjs";
import { OpenAI } from "openai";
import { Database } from "bun:sqlite";

type commandType = { description: string, formats: string[] };
type messageType = { author: string, content: string, channelID: string };

const db: Database = new Database("./chats.sqlite");
initialiseDatabase(db);
const DISCORD_TOKEN = process.env.DISCORD_TOKEN!;
const OPENAI_APIKEY: string = process.env.OPENAI_APIKEY!;
const openai: any = new OpenAI({ apiKey: OPENAI_APIKEY });
const client: any = new Client({ intents: [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent,
]});
const callcode: string = "<@1205825009315086458>";
const cmdlist: { [name: string]: commandType } = {
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
	"Calculator": {
		description: "Calculates the expression given. Docs: https://mathjs.org/",
		formats: ["calculate <expression>","calc <expression>"]
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
const context: string = [
	"Your name is Mr. Flower Pot, a discord chatbot.",
	"You are not actually about flowers or gardening.",
].join(" ");

function initialiseDatabase(db: Database): void {
	db.query(`
	CREATE TABLE IF NOT EXISTS messages (
		author TEXT,
		content TEXT,
		channelID TEXT
	)
	`).run();
}
function getMessagesByChannelID(db: Database, channelID: string): any[] {
	return db.query("SELECT * FROM messages WHERE channelID = $channelID").all({
		$channelID: channelID
	});
}
function insertMessage(db: Database, author: string, content: string, channelID: string): void {
	db.query("INSERT INTO messages (author, content, channelID) VALUES ($author, $content, $channelID)").run({
		$author: author,
		$content: content,
		$channelID: channelID
	});
}
function clearChat(db: Database, channelID: string): void {
	db.query("DELETE FROM messages WHERE channelID = $channelID").run({
		$channelID: channelID
	});
}
async function chatgptConversation(channelID: string): Promise<string> {
	let messages: any = getMessagesByChannelID(db, channelID);
	messages.forEach((message: messageType) => {
		if (!["system", "assistant", "function"].includes(message.author)) {
			message.author = "user";
		}
	});
	messages.unshift({ author: "system", content: context, channelID: channelID });
	const response: any = await openai.chat.completions.create({
		model: "gpt-3.5-turbo",
		messages: messages.map((message: messageType) => ({
			role: message.author,
			content: message.content
		})),
	});
	return response.choices[0].message.content;
}
async function dalle(prompt: string): Promise<string> {
	const img: any = await openai.images.generate({
		model: "dall-e-2",
		prompt: prompt,
		n: 1,
		size: "1024x1024",
	});
	return img.data[0].url;
}

client.on("ready", () => {
	console.log("Logged in as: " + client.user.tag);
	client.user.setActivity("help", { type: ActivityType.Listening });
});
client.on("messageCreate", async (message: any) => {
	if (message.author.bot) return;
	if (!message.content.startsWith(callcode)) return;
	try {
		const args: string[] = message.content.slice(callcode.length).trim().split(" ");
		const cmd: string = args.shift()!.toLowerCase();
		await message.channel.sendTyping();
		switch (cmd) {
			case "chat":
				if (args.length === 0) {
					message.reply("You did not send a message - cancelling command.");
					return;
				}
				insertMessage(db, message.author.tag, args.join(" "), message.channelId);
				const response: string = await chatgptConversation(message.channelId);
				insertMessage(db, "assistant", response, message.channelId);
				if (response === null || response === "") {
					message.reply("\u2800");
				} else {
					message.reply(response);
				}
				break;
			case "chatrefresh":
			case "chatr":
				clearChat(db, message.channelId);
				message.reply("Conversation refreshed.");
				break;
			case "dalle":
			case "imagine":
				if (args.length === 0) {
					message.reply("You did not send a prompt - cancelling command.");
					return;
				}
				const url: string = await dalle(args.join(" "));
				message.reply({files:[{ attachment: url, name: "image.jpg" }]});
				break;
			case "calculate":
			case "calc":
				if (args.length === 0) {
					message.reply("You did not send an expression - cancelling command.");
					return;
				}
				let exp: string = args.join(" ");
				try { message.reply(`${exp} = ${evaluate(exp).toString()}`); }
				catch (err: any) { message.reply(err.message); }
				break;
			case "say":
			case "repeat":
				if (args.length === 0) {
					message.reply("You did not send a message - cancelling command.");
					return;
				} else { message.channel.send(args.join(" ")) };
				break;
			case "coin":
			case "flip":
				message.reply(`You landed **${["heads", "tails"][Math.floor(Math.random() * 2)]}**!`);
				break;
			case "dice":
			case "roll":
				message.reply(`You rolled a **${1 + Math.floor(Math.random() * 5)}**!`);
				break;
			case "debug":
				message.reply(JSON.stringify(message, null, 4));
				break;
			case "help":
			case "":
				const footerText: string = "Requested by: " + message.author.tag;
				const footerIcon: string = message.author.displayAvatarURL();
				const embed = new EmbedBuilder()
					.setTitle("HELP MENU")
					.setColor(0xa56244)
					.setThumbnail(client.user.displayAvatarURL())
					.setFooter({ text: footerText, iconURL: footerIcon })
					.setTimestamp();
				for (const cmdname of Object.keys(cmdlist)) {
					const cmdobj: commandType = cmdlist[cmdname];
					let desc: string = cmdobj.description + "\n";
					const formatlist: string[] = cmdobj.formats.slice();
					for (let i = 0; i < formatlist.length; i++) {
						formatlist[i] = `@Mr. Flower Pot ${formatlist[i]}`;
					}
					desc += "```" + formatlist.join("\n") + "```";
					embed.addFields({ name: `__**${cmdname}**__`, value: desc });
				}
				message.channel.send({ embeds: [embed] });
				break;
			default:
				message.reply("Invalid command.");
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
			let id = "Please try again in ";
			let period = (err.message.includes("RPM"))?"minute":"day";
			let start = err.message.indexOf(id) + id.length;
			let end = err.message.indexOf(".", start);
			let timeout = err.message.slice(start, end);
			message.reply(`Requests per ${period} limit reached - please wait for ${timeout}.`);
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
		else if (err.message.startsWith("401 Incorrect API key provided")) {
			message.reply("Incorrect API key used.");
		}
		else {
			message.reply(`Unhandled error: ${err.message}`);
		}
		console.error(err);
	}
});
client.login(DISCORD_TOKEN);
