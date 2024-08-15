import { type Command } from "../index.ts";
import { ChatInputCommandInteraction } from "discord.js";

let say: Command = {
	name: "say",
	description: "Say the message given",
	options: [
		{
			type: 3,
			name: "message",
			description: "The message to say",
			required: true
		}
	],
	execute: async (interaction: ChatInputCommandInteraction) => {
		let message: string = interaction.options.getString("message")!;
		interaction.reply(message);
	}
};
export default say;
