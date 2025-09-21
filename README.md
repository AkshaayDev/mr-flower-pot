# Mr. Flower Pot🌸

## Overview
Mr. Flower Pot is a **discord bot** made using [TypeScript](https://www.typescriptlang.org) and [Bun](https://bun.sh).
It was originally created as a fun experimental bot, but can also be helpful to your servers.

## Features
Mr. Flower Pot works with discord slash commands.
The commands are as followed:
- `/help` - Mr. Flower Pot Help Menu
- `/calc` - Calculates the expression given using [Math.js](https://mathjs.org)
- `/say` - Say the message given
- `/coin` - Randomly returns heads or tails
- `/dice` - Returns a random number from 1 to 6

## Usage
### Prequisites
- Bun installed
- A discord bot with a token (from [Discord Developer Portal](https://discord.com/developers/docs/intro))

### Steps
1. **Clone and go to the repository**: `git clone https://github.com/akshaaydev/mr-flower-pot.git`, `cd mr-flower-pot`
2. **Install dependencies**: `bun run install`
3. **Set up the environment variables**: Create a `.env` file in the directory and add the discord bot token: `DISCORD_TOKEN={your-token-here}`
4. **Configure** the bot accordingly
5. **Run the bot**: `bun run start`
6. With the bot online, **add it to your server and use the commands**

## ⚙️Configuration
Customise the bot by changing the script or commands.
To add, remove or change features, just **make a new command file** in the `/commands/` folder following the same format as the other commands to create a command object and export it to `index.ts`.

Example:

```ts
import { type Command } from "../index.ts";
import { ChatInputCommandInteraction } from "discord.js";

let cmd: Command = {
	name: "cmd",
	description: "Example Command",
	info: "This text will only be shown with `/help`",
	execute: async (interaction: ChatInputCommandInteraction) => {
		interaction.reply("Hello, World!");
	}
};
export default cmd;

```

This makes `index.ts` register a command `/cmd` that replies with `"Hello, World!"`.
Alternatively, you can completely restructure the script to fit your use case.
