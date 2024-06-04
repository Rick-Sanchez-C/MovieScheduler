const { MessageActionRow, MessageButton, MessageSelectMenu, MessageEmbed } = require('discord.js');
const timetranslator = require('../utils/timetranslator');
const messageformater = require('../utils/messageformater');

class RoleVoteView {
    constructor(days = null, hours = null, organizer, role = null, force_next_week = false, channel) {
        this.days = days;
        this.hours = hours;
        this.organizer = organizer;
        this.role = role;
        this.force_next_week = force_next_week;
        this.channel = channel;
        this.votes = {};
    }

    async createVoteMessage() {
        const times = timetranslator(this.hours, this.days, this.force_next_week);
        const formattedTimes = times.map(time => messageformater.formatTimestamp(time[0]));

        const embed = new MessageEmbed()
            .setTitle('Se anuncia partida de rol, elegid a que hora está disponible.')
            .setDescription(formattedTimes.join('\n'));

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('reset')
                    .setLabel('Resetear')
                    .setStyle('DANGER'),
                new MessageButton()
                    .setCustomId('complete')
                    .setLabel('Completar')
                    .setStyle('SUCCESS'),
                new MessageButton()
                    .setCustomId('cannot_play')
                    .setLabel('No puedo jugar')
                    .setStyle('DANGER')
            );

        await this.channel.send({ embeds: [embed], components: [row] });
    }

    handleVote(interaction) {
        if (interaction.customId === 'cannot_play') {
            // Handle "cannot play" vote
        } else {
            // Handle time vote
            const userId = interaction.user.id;
            const time = interaction.values[0];
            this.votes[time] = this.votes[time] ? [...this.votes[time], userId] : [userId];
            this.notifyOrganizer(interaction.user);
        }
    }

    handleReset(interaction) {
        if (interaction.user.id === this.organizer.id) {
            this.votes = {};
            this.createVoteMessage();
        }
    }

    handleComplete(interaction) {
        if (interaction.user.id === this.organizer.id) {
            // Handle vote completion
        }
    }

    notifyOrganizer(user) {
        this.organizer.send(`El usuario ${user.username} ha votado.`);
    }
}

module.exports = RoleVoteView;