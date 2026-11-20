function getConfigFields() {
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Setup',
			value:
				'On the vMix PC, open the Vitrine settings page (tray icon → Settings), go to Integrations and create an API key. ' +
				'Use 127.0.0.1 if Companion runs on the vMix PC, otherwise the vMix PC address (the agent must listen on the LAN, e.g. "listen": "0.0.0.0:8090").',
		},
		{ type: 'textinput', id: 'host', label: 'Agent address', width: 8, default: '127.0.0.1' },
		{ type: 'number', id: 'port', label: 'Port', width: 4, min: 1, max: 65535, default: 8090 },
		{ type: 'secret-text', id: 'apiKey', label: 'API key (vik_…)', width: 12, default: '' },
		{
			type: 'number',
			id: 'guests',
			label: 'Guest variables/presets',
			tooltip: 'How many guest_N variables and guest buttons to create',
			width: 6,
			min: 1,
			max: 32,
			default: 8,
		},
		{
			type: 'number',
			id: 'slots',
			label: 'File variables/presets',
			tooltip: 'How many file buttons for the selected guest (slot_N)',
			width: 6,
			min: 1,
			max: 64,
			default: 16,
		},
	]
}

module.exports = { getConfigFields }
