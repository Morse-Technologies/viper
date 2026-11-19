/** The mock world is a snapshot: every relative time is measured from this instant (17:00 Europe/Madrid). */
export const MOCK_NOW = Date.parse("2026-11-19T16:00:00Z");

export const clockNow = () => new Date(MOCK_NOW);
