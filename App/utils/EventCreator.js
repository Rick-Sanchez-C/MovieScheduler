const { GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType } = require('discord.js');

async function createGuildEvent(guild, name, description, startTime, organizer, voicechannel) {
    try {
        const event = await guild.scheduledEvents.create({
            name,
            scheduledStartTime: startTime,
            privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
            entityType: GuildScheduledEventEntityType.Voice,
            description,
            voiceChannelId: voicechannel.id,
            channel: voicechannel // Adjust the logic to find the appropriate channel
        });

        await organizer.send(`Evento de guild creado: ${event.url}`);
    } catch (error) {
        console.error('Error creating guild event:', error);
        await organizer.send('Hubo un error al crear el evento de guild.');
    }
}

module.exports = { createGuildEvent };
