const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const createTimestamps = require('../utils/timetranslator');
const { formatTimestamp, formatTimeUntil } = require('../utils/messageformater');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolevote')
        .setDescription('Organiza una votación para una partida de rol.')
        .addUserOption(option =>
            option.setName('organizer')
                .setDescription('Organizador de la votación')
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

        let timestamps = createTimestamps(hours, days, forceNextWeek);

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
                .setMaxValues(timestampOptions.length) // Permitir seleccionar múltiples opciones
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

        const collector = voteMessage.createMessageComponentCollector();

        let votes = {};
        let notifiedUsers = new Set();

        const updateVoteMessage = async () => {
            const voteCounts = {};
            for (const userVotes of Object.values(votes)) {
                for (const vote of userVotes) {
                    if (!voteCounts[vote]) {
                        voteCounts[vote] = 0;
                    }
                    voteCounts[vote]++;
                }
            }

            const voteStats = Object.entries(voteCounts)
                .map(([timestamp, count]) => `${formatTimestamp(timestamp)} : ${count} votos`)
                .join('\n');

            await voteMessage.edit({
                content: `Se anuncia partida de rol, elegid a qué hora estáis disponibles. ${role ? role.toString() : '@everyone'}\nEstadísticas de votación:\n${voteStats}`,
                components: [row, buttonRow]
            });
        };

        collector.on('collect', async i => {
            if (i.isStringSelectMenu()) {
                if (i.user.id === organizer.id) {
                    const selectedTimes = new Set(i.values);
                    timestampOptions = timestampOptions.filter(option => selectedTimes.has(option.value));
                    //update select menu
                    row = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('select_time')
                            .setPlaceholder('Selecciona las horas disponibles')
                            .setMinValues(1)
                            .setMaxValues(timestampOptions.length) // Permitir seleccionar múltiples opciones
                            .addOptions(timestampOptions)
                    );
                    await i.update({ components: [row, buttonRow] });
                } else {
                    const selectedTimes = i.values;
                    const userId = i.user.id;

                    if (!votes[userId]) {
                        votes[userId] = [];
                    }

                    votes[userId] = selectedTimes;

                    if (!notifiedUsers.has(userId)) {
                        await organizer.send(`${i.user.tag} ha votado.`);
                        notifiedUsers.add(userId);
                    }

                    await i.deferUpdate();
                    await updateVoteMessage();
                }
            } else if (i.isButton()) {
                if (i.customId === 'reset' && i.user.id === organizer.id) {
                    votes = {};
                    notifiedUsers.clear();
                    timestampOptions = [...initialTimestampOptions]; // Restore initial options
                    row = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('select_time')
                            .setPlaceholder('Selecciona las horas disponibles')
                            .setMinValues(1)
                            .setMaxValues(timestampOptions.length) // Permitir seleccionar múltiples opciones
                            .addOptions(timestampOptions)
                    );
                    await i.update({ components: [row, buttonRow] });
                    await updateVoteMessage();
                } else if (i.customId === 'complete' && i.user.id === organizer.id) {
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
                        await channel.send('Aún no ha habido votaciones.');
                    } else {
                        const mostVotedTime = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0];
                        await channel.send(`La hora con más votos es: ${formatTimestamp(mostVotedTime[0])} con ${mostVotedTime[1]} votos.`);
                    }
                    collector.stop();
                } else if (i.customId === 'cannot_play') {
                    await organizer.send(`${i.user.tag} no puede jugar.`);
                    await i.deferUpdate();
                    await i.followUp({ content: 'El organizador ha sido notificado de que no puedes jugar.', ephemeral: true });
                } else {
                    await i.reply({ content: 'No tienes permiso para usar este botón.', ephemeral: true });
                }
            }
        });
    }
};
