const { GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType } = require('discord.js');

async function createGuildEvent(guild, name, description, startTime, organizer, voiceChannel) {
    try {
        const event = await guild.scheduledEvents.create({
            name,
            scheduledStartTime: startTime,
            privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
            entityType: GuildScheduledEventEntityType.Voice,
            description,
            channel: voiceChannel // Correctly reference the voice channel
        });

        await organizer.send(`Guild event created: ${event.url}`);
        return event; // Ensure the event object is returned
    } catch (error) {
        console.error('Error creating guild event:', error);
        await organizer.send('There was an error creating the guild event.');
        return null; // Return null in case of error
    }
}

module.exports = { createGuildEvent };
