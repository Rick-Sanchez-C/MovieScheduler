const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createTimestamps, formatTimestamp } = require('../utils');
const { handleSelectMenu, handleButtonPress, updateVoteMessage } = require('../handlers/voteHandlers');
const { createGuildEvent } = require('../utils/EventCreator'); // Import the createGuildEvent function

module.exports = {
    data: new SlashCommandBuilder()
        .setName('movieschedule')
        .setDescription('Organize a vote for a movie night.')
        .addUserOption(option =>
            option.setName('organizer')
                .setDescription('Organizer of the vote')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('voice_channel')
                .setDescription('Voice channel for the movie night')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('days')
                .setDescription('Days for the vote (separated by commas)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('hours')
                .setDescription('Hours for the vote (separated by commas)')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('force_next_week')
                .setDescription('Force the vote for next week')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.roles.cache.some(role => role.name === 'EventOrganizer')) {
            return interaction.reply('Only members with the "EventOrganizer" role can use this command.');
        }

        const organizer = interaction.options.getUser('organizer');
        const days = interaction.options.getString('days') ? interaction.options.getString('days').split(',') : null;
        const hours = interaction.options.getString('hours') ? interaction.options.getString('hours').split(',') : null;
        const forceNextWeek = interaction.options.getBoolean('force_next_week') || false;
        const channel = interaction.channel;
        const voiceChannel = interaction.options.getChannel('voice_channel');

        if (voiceChannel.type !== 2) {
            return await interaction.reply('Please select a voice channel.');
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
                .setPlaceholder('Select available times')
                .setMinValues(1)
                .setMaxValues(timestampOptions.length)
                .addOptions(timestampOptions)
        );

        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('reset')
                .setLabel('Reset')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('complete')
                .setLabel('Complete')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cannot_attend')
                .setLabel('Cannot Attend')
                .setStyle(ButtonStyle.Secondary)
        );

        const voteMessage = await channel.send({
            content: `Movie night announced, choose your available times. \nVoting statistics:`,
            components: [row, buttonRow]
        });

        const members = interaction.guild.members.cache;
        const eligibleMembers = members.filter(member => !member.user.bot);
        const totalEligible = eligibleMembers.size;

        const collector = voteMessage.createMessageComponentCollector();

        let votes = {};
        let notifiedUsers = new Set();
        let votingActive = true;

        const sendReminder = async () => {
            if (votingActive) {
                await channel.send('@everyone please remember to vote.');
            }
        };

        const reminderInterval = setInterval(sendReminder, 24 * 60 * 60 * 1000);

        const checkCompleteVotes = async () => {
            if (Object.keys(votes).length === totalEligible) {
                await handleButtonPress({ customId: 'complete', user: organizer }, organizer, votes, row, buttonRow, timestampOptions, initialTimestampOptions, channel, voteMessage, collector, interaction);
                votingActive = false;
                clearInterval(reminderInterval);
            }
        };

        collector.on('collect', async i => {
            if (i.isStringSelectMenu()) {
                await handleSelectMenu(i, organizer, votes, row, buttonRow, timestampOptions, initialTimestampOptions, voteMessage);
                await checkCompleteVotes();
            } else if (i.isButton()) {
                await handleButtonPress(i, organizer, votes, row, buttonRow, timestampOptions, initialTimestampOptions, channel, voteMessage, collector, interaction);
            }
        });
    }
};
