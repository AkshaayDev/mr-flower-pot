import { type Command, cmdlist } from "../index.ts"
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

let help: Command = {
	name: "help",
	description: "Mr. Flower Pot Help Menu",
	execute: async (interaction: ChatInputCommandInteraction) => {
		const footerText: string = "Requested by: " + interaction.user.tag;
		const footerIcon: string = interaction.user.displayAvatarURL();
		const embed = new EmbedBuilder()
			.setTitle("HELP MENU")
			.setColor(0xa56244)
			.setThumbnail(interaction.client.user.displayAvatarURL())
			.setFooter({ text: footerText, iconURL: footerIcon })
			.setTimestamp();
		
		for (let cmd of cmdlist) {
			if (cmd.name === "help") { continue; }
			let name: string = `__**/${cmd.name}**__`;
			let desc: string = cmd.description;
			let info: string = cmd.info ?? "";
			let value: string = desc + "\n" + info;
			embed.addFields({ name: name, value: value });
		}
		interaction.reply({ embeds: [embed] });
	}
};
export default help;
