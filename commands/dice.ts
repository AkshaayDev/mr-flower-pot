import { type Command } from "../index.ts";
import { ChatInputCommandInteraction } from "discord.js";

let dice: Command = {
	name: "dice",
	description: "Returns a random number from 1 to 6",
	execute: async (interaction: ChatInputCommandInteraction) => {
		interaction.reply(`You rolled a **${1 + Math.floor(Math.random() * 6)}**!`);
	}
};
export default dice;
