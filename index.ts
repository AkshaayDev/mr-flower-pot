import { Client, GatewayIntentBits, Events, ActivityType, Guild, REST, Routes, type Interaction, ChatInputCommandInteraction } from "discord.js";

// Type definition for a command object for loading and handling
type Command = {
	name: string,
	description: string,
	info?: string
	options?: {
		type: number,
		name: string,
		description: string,
		required: boolean
	}[],
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>
};

// Load commands from each file in ./commands/ folder
const cmdlist: Command[] = [];
const files: string[] = ["help","calc","say","coin","dice"];
for (const file of files) {
	const module = await import(`./commands/${file}.ts`);
	cmdlist.push(module.default);
}

const DISCORD_TOKEN: string = process.env.DISCORD_TOKEN!;
const client: Client = new Client({ intents: [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent,
]});

// Load and register commands with discord via REST API
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
async function loadCommands(guild: Guild) {
	try {
		await rest.put(Routes.applicationGuildCommands(client.user!.id, guild.id), {
			body: cmdlist.map(cmd => ({
				name: cmd.name,
				description: cmd.description,
				options: cmd.options
			}))
		});
	} catch (error) {
		console.error("Error loading commands:\n", error);
	}
}

client.on(Events.ClientReady, () => {
	console.log("Logged in as: " + client.user!.tag);
	// Listening to /help
	client.user!.setActivity("/help", { type: ActivityType.Listening });
	// Load commands for every guild the bot is in
	client.guilds.cache.each((guild: Guild) => { loadCommands(guild); });
});

// Load commands when added to a new guild
client.on(Events.GuildCreate, (guild: Guild) => {
	loadCommands(guild);
});

// Handle each command
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
	if (!interaction.isChatInputCommand()) { return; }
	const cmd: Command = cmdlist.find(cmd => cmd.name === interaction.commandName)!;
	await cmd.execute(interaction);
});

client.login(DISCORD_TOKEN);
export { type Command, cmdlist };
