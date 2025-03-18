export function wrapPlayerId(playerId: string) {
  if (/^\w+\(\d+\)/.test(playerId)) {
    return playerId;
  } else {
    // Assume xuid
    return `xuid(${playerId})`;
  }
}

export function unwrapPlayerId(playerId: string) {
  const match = /^\w+\((\d+)\)$/.exec(playerId);
  if (match) {
    return match[1];
  } else {
    return playerId;
  }
}
