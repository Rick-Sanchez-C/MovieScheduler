const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createTimestamps, formatTimestamp } = require('../utils');
const { handleSelectMenu, handleButtonPress, updateVoteMessage } = require('../handlers/voteHandlers');
const { createGuildEvent } = require('../utils/EventCreator'); // Import the createGuildEvent function

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolevote')
        .setDescription('Organiza una votación para una partida de rol.')
        .addUserOption(option =>
            option.setName('organizer')
                .setDescription('Organizador de la votación')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('voice_channel')
                .setDescription('Canal de voz para la partida')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('days')
                .setDescription('Días para la votación (separados por comas)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('hours')
                .setDescription('Horas para la votación (separadas por comas)')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Rol que participa en la votación')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('force_next_week')
                .setDescription('Forzar la votación para la próxima semana')
                .setRequired(false)),
    async execute(interaction) {
        const organizer = interaction.options.getUser('organizer');
        const days = interaction.options.getString('days') ? interaction.options.getString('days').split(',') : null;
        const hours = interaction.options.getString('hours') ? interaction.options.getString('hours').split(',') : null;
        const role = interaction.options.getRole('role');
        const forceNextWeek = interaction.options.getBoolean('force_next_week') || false;
        const channel = interaction.channel;
        const voicechannel = interaction.options.getChannel('voice_channel');
        //2 = voice channel
        if (!(voicechannel.type === 2)) {
            return await interaction.reply('Por favor, selecciona un canal de voz.');
        }

        const timestamps = createTimestamps(hours, days, forceNextWeek);

        const initialTimestampOptions = timestamps.map(timestamp => ({
            label: timestamp[1],
            value: timestamp[0].toString()
        }));

        let timestampOptions = [...initialTimestampOptions];

        let row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_time')
                .setPlaceholder('Selecciona las horas disponibles')
                .setMinValues(1)
                .setMaxValues(timestampOptions.length)
                .addOptions(timestampOptions)
        );

        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('reset')
                .setLabel('Resetear')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('complete')
                .setLabel('Completar')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cannot_play')
                .setLabel('No puedo jugar')
                .setStyle(ButtonStyle.Secondary)
        );

        const voteMessage = await channel.send({
            content: `Se anuncia partida de rol, elegid a qué hora estáis disponibles. ${role ? role.toString() : '@everyone'}\nEstadísticas de votación:`,
            components: [row, buttonRow]
        });

        const members = role ? role.members : interaction.guild.members.cache;
        const eligibleMembers = members.filter(member => !member.user.bot);
        const totalEligible = eligibleMembers.size;

        const collector = voteMessage.createMessageComponentCollector();

        let votes = {};
        let notifiedUsers = new Set();
        let votingActive = true;

        const sendReminder = async () => {
            if (votingActive) {
                await channel.send(`${role ? role.toString() : '@everyone'} por favor recuerden votar.`);
            }
        };

        const reminderInterval = setInterval(sendReminder, 24 * 60 * 60 * 1000);

        const checkCompleteVotes = async () => {
            if (Object.keys(votes).length === totalEligible) {
                await handleButtonPress({ customId: 'complete', user: organizer }, organizer, votes, notifiedUsers, row, buttonRow, timestampOptions, initialTimestampOptions, channel, voteMessage, collector, role);
                votingActive = false;
                clearInterval(reminderInterval);
            }
        };

        collector.on('collect', async i => {
            if (i.isStringSelectMenu()) {
                await handleSelectMenu(i, organizer, votes, notifiedUsers, row, buttonRow, timestampOptions, initialTimestampOptions, role, voteMessage);
                await checkCompleteVotes();
            } else if (i.isButton()) {
                await handleButtonPress(i, organizer, votes, notifiedUsers, row, buttonRow, timestampOptions, initialTimestampOptions, channel, voteMessage, collector, role);
                if (i.customId === 'complete') {
                    votingActive = false;
                    clearInterval(reminderInterval);

                    // Crear evento de guild cuando la votación se complete
                    const voteCounts = {};
                    for (const userVotes of Object.values(votes)) {
                        for (const vote of userVotes) {
                            if (!voteCounts[vote]) {
                                voteCounts[vote] = 0;
                            }
                            voteCounts[vote]++;
                        }
                    }
                    if (Object.keys(voteCounts).length === 0) {
                        //Use the first timestamp option as the default time
                        const defaultTime = initialTimestampOptions[0].value;
                        //Add the organizer's vote to the vote counts
                        voteCounts[defaultTime] = 1;
                    }

                    const rolename = role ? role.name : 'todos';
                    const roletag = role ? role.tag : '@everyone';
                    const mostVotedTime = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0];
                    const startTime = new Date(mostVotedTime[0] * 1000); // Convertir el timestamp a Date
                    const eventName = 'Partida de Rol Para '+rolename;
                    const eventDescription = `Partida de rol organizada por ${organizer.tag} para ${roletag} en ${startTime.toLocaleString()}`;
                    await createGuildEvent(interaction.guild, eventName, eventDescription, startTime, organizer,voicechannel);
                }
            }
        });
    }
};
