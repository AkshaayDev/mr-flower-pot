import type { Command } from "../index.ts";
import { ChatInputCommandInteraction } from "discord.js";
import { evaluate } from "mathjs";

let calc: Command = {
	name: "calc",
	description: "Calculates the expression given",
	info: "Docs: https://mathjs.org/",
	options: [
		{
			type: 3,
			name: "expression",
			description: "The expression to calculate",
			required: true
		}
	],
	execute: async (interaction: ChatInputCommandInteraction) => {
		let exp: string = interaction.options.getString("expression")!;
		try { interaction.reply(`${exp} = ${evaluate(exp).toString()}`); }
		catch (err: any) { interaction.reply(err.message); }
	}
};
export default calc;
