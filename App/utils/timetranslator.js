const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone'); // Necesitarás instalar este módulo con npm install moment-timezone
const dayOfWeek = require('./DayOfWeek'); // Asegúrate de que la ruta sea correcta

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config.json'), 'utf8'));

function createTimestamps(Hours = config.default_times, Days = ['sábado', 'domingo'], ForceNextWeek = false, TimeZone = config.time_zone) {
    // Comprobación de los argumentos
    Hours = Hours==null?config.default_times:Hours;
    Days = Days==null?config.default_days:Days;
    TimeZone = TimeZone==null?config.time_zone:TimeZone;
    if (!Array.isArray(Hours) || !Hours.every(hour => /^([01]\d|2[0-3]):([0-5]\d)$/.test(hour))) {
        throw new Error('Hours debe ser un array de strings en formato HH:MM');
    }
    if (!Array.isArray(Days) || !Days.every(day => typeof day === 'string')) {
        throw new Error('Days debe ser un array de strings');
    }
    if (typeof ForceNextWeek !== 'boolean') {
        throw new Error('ForceNextWeek debe ser un boolean');
    }
    if (typeof TimeZone !== 'string' || !moment.tz.zone(TimeZone)) {
        throw new Error('TimeZone debe ser un string válido de zona horaria');
    }

    // Creación de los timestamps
    const timestamps = [];
    const now = moment().tz(TimeZone);
    if (ForceNextWeek) {
        now.add(1, 'week');
    }

    for (const day of Days) {
        const dayNumber = dayOfWeek(day);
        for (const hour of Hours) {
            const [hourNumber, minuteNumber] = hour.split(':').map(Number);
            const timestamp = now.clone().day(dayNumber).hour(hourNumber).minute(minuteNumber).second(0);
            if (timestamp.isBefore(now)) {
                timestamp.add(1, 'week');
            }
            timestamps.push([timestamp.unix(), timestamp.format()]);
        }
    }

    return timestamps;
}

module.exports = createTimestamps;