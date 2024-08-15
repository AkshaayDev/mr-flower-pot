import { type Command } from "../index.ts";
import { ChatInputCommandInteraction } from "discord.js";

let coin: Command =  {
	name: "coin",
	description: "Randomly returns heads or tails",
	execute: async (interaction: ChatInputCommandInteraction) => {
		interaction.reply(`You landed **${Math.random() < 0.5 ? "heads": "tails"}**!`);
	}
};
export default coin;
