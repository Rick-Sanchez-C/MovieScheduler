function dayOfWeek(day) {
    const days = {
        'sunday': 0, 's': 0, 'domingo': 0, 'd': 0,
        'monday': 1, 'm': 1, 'lunes': 1, 'l': 1,
        'tuesday': 2, 't': 2, 'martes': 2, 'm': 2,
        'wednesday': 3, 'w': 3, 'miércoles': 3, 'mi': 3,
        'thursday': 4, 'th': 4, 'jueves': 4, 'j': 4,
        'friday': 5, 'f': 5, 'viernes': 5, 'v': 5,
        'saturday': 6, 'sa': 6, 'sábado': 6, 's': 6
    };

    return days[day.toLowerCase()];
}
module.exports = dayOfWeek;