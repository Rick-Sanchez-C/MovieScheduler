const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone'); // Ensure you have installed this module with npm install moment-timezone
const dayOfWeek = require('./DayOfWeek'); // Ensure the path is correct

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config.json'), 'utf8'));

function createTimestamps(Hours = config.default_times, Days = ['Saturday', 'Sunday'], ForceNextWeek = false, TimeZone = config.time_zone) {
    // Argument validation
    Hours = Hours == null ? config.default_times : Hours;
    Days = Days == null ? config.default_days : Days;
    TimeZone = TimeZone == null ? config.time_zone : TimeZone;
    if (!Array.isArray(Hours) || !Hours.every(hour => /^([01]\d|2[0-3]):([0-5]\d)$/.test(hour))) {
        throw new Error('Hours must be an array of strings in HH:MM format');
    }
    if (!Array.isArray(Days) || !Days.every(day => typeof day === 'string')) {
        throw new Error('Days must be an array of strings');
    }
    if (typeof ForceNextWeek !== 'boolean') {
        throw new Error('ForceNextWeek must be a boolean');
    }
    if (typeof TimeZone !== 'string' || !moment.tz.zone(TimeZone)) {
        throw new Error('TimeZone must be a valid time zone string');
    }

    // Creation of timestamps
    const timestamps = [];
    const now = moment().tz(TimeZone);
    if (ForceNextWeek) {
        now.add(1, 'week');
    }

    for (const day of Days) {
        const dayNumber = dayOfWeek(day);
        for (const hour of Hours) {
            const [hourNumber, minuteNumber] = hour.split(':').map(Number);
            let timestamp = moment().tz(TimeZone).day(dayNumber).hour(hourNumber).minute(minuteNumber).second(0);
            if (timestamp.isBefore(now)) {
                timestamp.add(1, 'week');
            }
            timestamps.push([timestamp.unix(), timestamp.format()]);
        }
    }

    return timestamps;
}

module.exports = createTimestamps;
