const guestOption = {
	type: 'number',
	id: 'guest',
	label: 'Guest number (0 = the selected guest)',
	default: 0,
	min: 0,
	max: 64,
}
const fileOption = { type: 'number', id: 'file', label: 'File number', default: 1, min: 1, max: 999 }
const fromOption = {
	type: 'dropdown',
	id: 'from',
	label: 'Videos and audio start',
	default: 'start',
	choices: [
		{ id: 'start', label: 'From the start' },
		{ id: 'resume', label: 'Where they were stopped (Resume)' },
	],
}

function actionDefinitions(self) {
	const c = self.client
	const guestOf = (opt) => (opt.guest > 0 ? opt.guest : self.selectedGuest)
	const run = async (fn) => {
		try {
			await fn()
		} catch (e) {
			self.log('warn', e.message)
		}
	}

	return {
		select_guest: {
			name: 'Select guest (for the file buttons)',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Mode',
					default: 'number',
					choices: [
						{ id: 'number', label: 'Guest number' },
						{ id: 'next', label: 'Next guest' },
						{ id: 'prev', label: 'Previous guest' },
					],
				},
				{
					type: 'number',
					id: 'guest',
					label: 'Guest number',
					default: 1,
					min: 1,
					max: 64,
					isVisible: (o) => o.mode === 'number',
				},
			],
			callback: (ev) => {
				const count = Math.max(1, c.guests().length)
				let g = self.selectedGuest
				if (ev.options.mode === 'next') g = (g % count) + 1
				else if (ev.options.mode === 'prev') g = g <= 1 ? count : g - 1
				else g = ev.options.guest
				self.selectGuest(g)
			},
		},
		toggle_file: {
			name: 'Toggle file (tap: live, tap again: back to the default input)',
			options: [guestOption, fileOption, fromOption],
			callback: (ev) => run(() => c.toggle(guestOf(ev.options), ev.options.file, ev.options.from)),
		},
		take_file: {
			name: 'Take file (always put it live)',
			options: [guestOption, fileOption, fromOption],
			callback: (ev) => run(() => c.take(guestOf(ev.options), ev.options.file, ev.options.from)),
		},
		clear: {
			name: 'Clear screen (back to the default input)',
			options: [],
			callback: () => run(() => c.clear()),
		},
		stop_audio: {
			name: 'Stop audio',
			options: [],
			callback: () => run(() => c.stopAudio()),
		},
		play_pause: {
			name: 'Play / pause',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Mode',
					default: 'toggle',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'play', label: 'Play' },
						{ id: 'pause', label: 'Pause' },
					],
				},
			],
			callback: (ev) =>
				run(() => (ev.options.mode === 'play' ? c.play() : ev.options.mode === 'pause' ? c.pause() : c.playPause())),
		},
		restart: {
			name: 'Play from the start',
			options: [],
			callback: () => run(() => c.seekTo(0)),
		},
		seek_relative: {
			name: 'Skip forward / back',
			options: [
				{ type: 'number', id: 'seconds', label: 'Seconds (negative = back)', default: 10, min: -3600, max: 3600 },
			],
			callback: (ev) => run(() => c.seekBy(ev.options.seconds)),
		},
		seek_to: {
			name: 'Go to time',
			options: [
				{ type: 'textinput', id: 'time', label: 'Time (m:ss or seconds)', default: '0:00', useVariables: true },
			],
			callback: async (ev, ctx) => {
				const text = await ctx.parseVariablesInString(ev.options.time)
				const parts = String(text).trim().split(':').map(Number)
				if (parts.some(isNaN)) return self.log('warn', `Not a time: ${text}`)
				const secs = parts.reduce((acc, p) => acc * 60 + p, 0)
				return run(() => c.seekTo(secs * 1000))
			},
		},
		jump_marker: {
			name: 'Jump to marker',
			options: [{ type: 'number', id: 'marker', label: 'Marker number (in time order)', default: 1, min: 1, max: 99 }],
			callback: (ev) => run(() => c.jumpToMarker(ev.options.marker)),
		},
		add_marker: {
			name: 'Add marker here',
			options: [{ type: 'textinput', id: 'label', label: 'Label (empty = the time)', default: '', useVariables: true }],
			callback: async (ev, ctx) => {
				const label = await ctx.parseVariablesInString(ev.options.label || '')
				return run(() => c.addMarker(label))
			},
		},
		send_pulpit: {
			name: 'Show guest on the pulpit tablet',
			options: [guestOption],
			callback: (ev) => run(() => c.sendToPulpit(guestOf(ev.options))),
		},
		pulpit_page: {
			name: 'Pulpit tablet: go to page',
			options: [{ type: 'number', id: 'page', label: 'Page', default: 1, min: 1, max: 99 }],
			callback: (ev) => run(() => c.pulpitPage(ev.options.page)),
		},
		reconnect: {
			name: 'Reconnect to the agent',
			options: [],
			callback: () => c.start(),
		},
	}
}

module.exports = { actionDefinitions }
