function formatTimestamp(unixTime) {
    return `<t:${unixTime}>`;
}

function formatTimeUntil(unixTime) {
    return `<t:${unixTime}:R>`;
}

module.exports = { formatTimestamp, formatTimeUntil };