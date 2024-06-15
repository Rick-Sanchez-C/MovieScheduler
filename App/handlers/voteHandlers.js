const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { formatTimestamp } = require('../utils');

async function handleSelectMenu(i, organizer, votes, notifiedUsers, row, buttonRow, timestampOptions, initialTimestampOptions, role, voteMessage) {
    if (i.user.id === organizer.id) {
        const selectedTimes = new Set(i.values);
        timestampOptions = timestampOptions.filter(option => selectedTimes.has(option.value));
        row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_time')
                .setPlaceholder('Selecciona las horas disponibles')
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

        if (!notifiedUsers.has(userId)) {
            await organizer.send(`${i.user.tag} ha votado.`);
            notifiedUsers.add(userId);
        }

        await i.deferUpdate();
        await updateVoteMessage(voteMessage, row, buttonRow, votes, initialTimestampOptions, role);
    }
}

async function handleButtonPress(i, organizer, votes, notifiedUsers, row, buttonRow, timestampOptions, initialTimestampOptions, channel, voteMessage, collector, role) {
    if (i.customId === 'reset' && i.user.id === organizer.id) {
        votes = {};
        notifiedUsers.clear();
        timestampOptions = [...initialTimestampOptions];
        row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_time')
                .setPlaceholder('Selecciona las horas disponibles')
                .setMinValues(1)
                .setMaxValues(timestampOptions.length)
                .addOptions(timestampOptions)
        );
        await i.update({ components: [row, buttonRow] });
        await updateVoteMessage(voteMessage, row, buttonRow, votes, initialTimestampOptions, role);
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
            //Use the first timestamp option as the default time
            const defaultTime = initialTimestampOptions[0].value;
            //Add the organizer's vote to the vote counts
            voteCounts[defaultTime] = 1;
        }
        const mostVotedTime = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0];
        await channel.send(`La hora con más votos es: ${formatTimestamp(mostVotedTime[0])} con ${mostVotedTime[1]} votos.`);
        collector.stop();
    } else if (i.customId === 'cannot_play') {
        await organizer.send(`${i.user.tag} no puede jugar.`);
        await i.deferUpdate();
        await i.followUp({ content: 'El organizador ha sido notificado de que no puedes jugar.', ephemeral: true });
    } else {
        await i.reply({ content: 'No tienes permiso para usar este botón.', ephemeral: true });
    }
}

async function updateVoteMessage(voteMessage, row, buttonRow, votes, initialTimestampOptions, role) {
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
}

module.exports = {
    handleSelectMenu,
    handleButtonPress,
    updateVoteMessage
};
