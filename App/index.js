const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, REST } = require('discord.js');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config(); // Cargar variables de entorno desde .env

const token = process.env.DISCORD_TOKEN; // Obtener el token desde las variables de entorno

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

// Registering commands globally
const rest = new REST({ version: '9' }).setToken(token);

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Registering commands globally once the bot is ready
    (async () => {
        try {
            console.log('Started refreshing application (/) commands globally.');

            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands },
            );

            console.log('Successfully reloaded application (/) commands globally.');
        } catch (error) {
            console.error(error);
        }
    })();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.login(token);
