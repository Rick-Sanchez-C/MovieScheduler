const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { formatTimestamp } = require('../utils');
const { createGuildEvent } = require('../utils/EventCreator'); // Import the createGuildEvent function

async function handleSelectMenu(i, organizer, votes, row, buttonRow, timestampOptions, initialTimestampOptions, voteMessage) {
    if (i.user.id === organizer.id) {
        const selectedTimes = new Set(i.values);
        timestampOptions = timestampOptions.filter(option => selectedTimes.has(option.value));
        row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_time')
                .setPlaceholder('Select available times')
                .setMinValues(1)
                .setMaxValues(timestampOptions.length)
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

        await i.deferUpdate();
        await updateVoteMessage(voteMessage, row, buttonRow, votes, initialTimestampOptions);
    }
}

let eventCreated = false;

async function handleButtonPress(i, organizer, votes, row, buttonRow, timestampOptions, initialTimestampOptions, channel, voteMessage, collector, interaction) {
    if (i.customId === 'reset' && i.user.id === organizer.id) {
        votes = {};
        timestampOptions = [...initialTimestampOptions];
        row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_time')
                .setPlaceholder('Select available times')
                .setMinValues(1)
                .setMaxValues(timestampOptions.length)
                .addOptions(timestampOptions)
        );
        await i.update({ components: [row, buttonRow] });
        await updateVoteMessage(voteMessage, row, buttonRow, votes, initialTimestampOptions);
    } else if (i.customId === 'complete' && i.user.id === organizer.id && !eventCreated) {
        eventCreated = true; // Ensure the event is created only once

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
            // Use the first timestamp option as the default time
            const defaultTime = initialTimestampOptions[0].value;
            // Add the organizer's vote to the vote counts
            voteCounts[defaultTime] = 1;
        }
        const mostVotedTime = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0];
        const startTime = new Date(mostVotedTime[0] * 1000); // Convert timestamp to Date
        const eventName = 'Movie Night';
        const eventDescription = `Movie night organized by ${organizer.tag} on ${startTime.toLocaleString()}`;
        const event = await createGuildEvent(interaction.guild, eventName, eventDescription, startTime, organizer, interaction.options.getChannel('voice_channel'));

        if (event) {
            const eventLink = `https://discord.com/events/${interaction.guild.id}/${event.id}`;

            // Notify the organizer and users who voted for the most voted time
            const voters = Object.keys(votes).filter(userId => votes[userId].includes(mostVotedTime[0]));
            const userNotifications = voters.map(userId => `<@${userId}>`).join(', ');
            await channel.send(`The time with the most votes is: ${formatTimestamp(mostVotedTime[0])} with ${mostVotedTime[1]} votes.\nEvent link: ${eventLink}`);
            await channel.send(`The following users voted for this time: ${userNotifications}`);
        } else {
            await channel.send('There was an error creating the event.');
        }
        collector.stop();
    } else if (i.customId === 'cannot_attend') {
        await i.deferUpdate();
        await i.followUp({ content: 'The organizer has been notified that you cannot attend.', ephemeral: true });
    } else {
        await i.reply({ content: 'You do not have permission to use this button.', ephemeral: true });
    }
}

async function updateVoteMessage(voteMessage, row, buttonRow, votes, initialTimestampOptions) {
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
        .map(([timestamp, count]) => `${formatTimestamp(timestamp)} : ${count} votes`)
        .join('\n');

    // Ensure voteMessage is an instance of Message
    if (voteMessage && typeof voteMessage.edit === 'function') {
        await voteMessage.edit({
            content: `Movie night announced, choose your available times. @everyone\nVoting statistics:\n${voteStats}`,
            components: [row, buttonRow]
        });
    } else {
        console.error('voteMessage is not a valid Message instance.');
    }
}

module.exports = {
    handleSelectMenu,
    handleButtonPress,
    updateVoteMessage
};
