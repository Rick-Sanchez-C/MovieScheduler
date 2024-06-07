const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createTimestamps, formatTimestamp } = require('../utils');
const { handleSelectMenu, handleButtonPress, updateVoteMessage } = require('../handlers/voteHandlers');

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

        const checkCompleteVotes = async () => {
            if (Object.keys(votes).length === totalEligible) {
                await handleButtonPress({ customId: 'complete', user: organizer }, organizer, votes, notifiedUsers, row, buttonRow, timestampOptions, initialTimestampOptions, channel, voteMessage, collector, role);
            }
        };

        collector.on('collect', async i => {
            if (i.isStringSelectMenu()) {
                await handleSelectMenu(i, organizer, votes, notifiedUsers, row, buttonRow, timestampOptions, initialTimestampOptions, role, voteMessage);
                await checkCompleteVotes();
            } else if (i.isButton()) {
                await handleButtonPress(i, organizer, votes, notifiedUsers, row, buttonRow, timestampOptions, initialTimestampOptions, channel, voteMessage, collector, role);
            }
        });
        interaction.followUp({content :'Votación de partida de rol creada correctamente.', ephemeral : true});
    }
};
