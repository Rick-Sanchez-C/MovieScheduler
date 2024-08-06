function dayOfWeek(day) {
    const days = {
        'sunday': 0, 'sun': 0, 's': 0, 'domingo': 0, 'do': 0, 'д': 0, 'воскресенье': 0, 'вс': 0, 'sonntag': 0, 'so': 0,
        'monday': 1, 'mon': 1, 'm': 1, 'lunes': 1, 'lu': 1, 'л': 1, 'понедельник': 1, 'пн': 1, 'montag': 1, 'mo': 1,
        'tuesday': 2, 'tue': 2, 't': 2, 'martes': 2, 'ma': 2, 'м': 2, 'вторник': 2, 'вт': 2, 'dienstag': 2, 'di': 2,
        'wednesday': 3, 'wed': 3, 'w': 3, 'miércoles': 3, 'miercoles': 3, 'mi': 3, 'с': 3, 'среда': 3, 'ср': 3, 'mittwoch': 3, 'mi': 3,
        'thursday': 4, 'thu': 4, 'th': 4, 'jueves': 4, 'ju': 4, 'ч': 4, 'четверг': 4, 'чт': 4, 'donnerstag': 4, 'do': 4,
        'friday': 5, 'fri': 5, 'f': 5, 'viernes': 5, 'vi': 5, 'п': 5, 'пятница': 5, 'пт': 5, 'freitag': 5, 'fr': 5,
        'saturday': 6, 'sat': 6, 'sa': 6, 'sábado': 6, 'sabado': 6, 'sá': 6, 's': 6, 'с': 6, 'суббота': 6, 'сб': 6, 'samstag': 6, 'sa': 6
    };

    return days[day.toLowerCase()];
}

module.exports = dayOfWeek;
