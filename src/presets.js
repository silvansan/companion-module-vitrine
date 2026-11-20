const { combineRgb } = require('@companion-module/base')

const DARK = combineRgb(30, 30, 30)
const WHITE = combineRgb(255, 255, 255)
const RED = combineRgb(200, 0, 0)
const ORANGE = combineRgb(230, 130, 0)
const BLUE = combineRgb(0, 80, 180)
const BLACK = combineRgb(0, 0, 0)

function button(category, name, text, actions, feedbacks, size) {
	return {
		type: 'button',
		category,
		name,
		style: { text, size: size || 'auto', color: WHITE, bgcolor: DARK },
		steps: [{ down: actions, up: [] }],
		feedbacks: feedbacks || [],
	}
}

function presetDefinitions(self) {
	const v = (name) => `$(${self.label}:${name})`
	const presets = {}

	for (let g = 1; g <= self.guestCount; g++) {
		presets[`guest_${g}`] = button(
			'Guests',
			`Guest ${g}`,
			v(`guest_${g}`),
			[{ actionId: 'select_guest', options: { mode: 'number', guest: g } }],
			[
				{ feedbackId: 'guest_selected', options: { guest: g }, style: { bgcolor: BLUE, color: WHITE } },
				{ feedbackId: 'guest_live', options: { guest: g }, style: { bgcolor: RED, color: WHITE } },
			],
			'14',
		)
	}
	presets.guest_prev = button('Guests', 'Previous guest', '◀ Guest', [
		{ actionId: 'select_guest', options: { mode: 'prev', guest: 1 } },
	])
	presets.guest_next = button('Guests', 'Next guest', 'Guest ▶', [
		{ actionId: 'select_guest', options: { mode: 'next', guest: 1 } },
	])
	presets.guest_selected = button(
		'Guests',
		'Selected guest name',
		v('selected_guest_name'),
		[{ actionId: 'send_pulpit', options: { guest: 0 } }],
		[
			{
				feedbackId: 'guest_on_pulpit',
				options: { guest: 0 },
				style: { bgcolor: combineRgb(0, 120, 60), color: WHITE },
			},
		],
		'14',
	)

	for (let f = 1; f <= self.slotCount; f++) {
		presets[`file_${f}`] = button(
			'Files of the selected guest',
			`File ${f}`,
			v(`slot_${f}_label`),
			[{ actionId: 'toggle_file', options: { guest: 0, file: f, from: 'start' } }],
			[
				{ feedbackId: 'file_live', options: { guest: 0, file: f }, style: { bgcolor: RED, color: WHITE } },
				{ feedbackId: 'file_pending', options: { guest: 0, file: f }, style: { bgcolor: ORANGE, color: BLACK } },
			],
			'7',
		)
	}

	presets.clear = button(
		'Screen',
		'Clear screen',
		'CLEAR\\nscreen',
		[{ actionId: 'clear', options: {} }],
		[{ feedbackId: 'live_kind', options: { kind: 'any' }, style: { bgcolor: RED, color: WHITE } }],
		'18',
	)
	presets.now = button(
		'Screen',
		'Now live',
		`${v('live_kind')}\\n${v('live_name')}`,
		[],
		[
			{ feedbackId: 'live_kind', options: { kind: 'video' }, style: { bgcolor: RED, color: WHITE } },
			{ feedbackId: 'live_kind', options: { kind: 'photo' }, style: { bgcolor: RED, color: WHITE } },
			{
				feedbackId: 'live_kind',
				options: { kind: 'audio' },
				style: { bgcolor: combineRgb(130, 0, 160), color: WHITE },
			},
			{
				feedbackId: 'offline',
				options: {},
				style: { bgcolor: combineRgb(90, 90, 90), color: combineRgb(255, 200, 0) },
			},
		],
		'7',
	)
	presets.stop_audio = button('Screen', 'Stop audio', 'STOP\\naudio', [{ actionId: 'stop_audio', options: {} }])

	presets.play_pause = button(
		'Video and audio',
		'Play / pause',
		'⏯',
		[{ actionId: 'play_pause', options: { mode: 'toggle' } }],
		[
			{ feedbackId: 'playing', options: {}, style: { bgcolor: combineRgb(0, 140, 0), color: WHITE } },
			{ feedbackId: 'paused', options: {}, style: { bgcolor: ORANGE, color: BLACK } },
		],
		'30',
	)
	presets.restart = button('Video and audio', 'From the start', '⏮\\nfrom start', [
		{ actionId: 'restart', options: {} },
	])
	presets.back10 = button(
		'Video and audio',
		'Back 10 s',
		'-10s',
		[{ actionId: 'seek_relative', options: { seconds: -10 } }],
		[],
		'18',
	)
	presets.fwd10 = button(
		'Video and audio',
		'Forward 10 s',
		'+10s',
		[{ actionId: 'seek_relative', options: { seconds: 10 } }],
		[],
		'18',
	)
	presets.back30 = button(
		'Video and audio',
		'Back 30 s',
		'-30s',
		[{ actionId: 'seek_relative', options: { seconds: -30 } }],
		[],
		'18',
	)
	presets.fwd30 = button(
		'Video and audio',
		'Forward 30 s',
		'+30s',
		[{ actionId: 'seek_relative', options: { seconds: 30 } }],
		[],
		'18',
	)
	presets.time_left = button(
		'Video and audio',
		'Time left',
		`${v('time_left')}\\nleft`,
		[],
		[{ feedbackId: 'time_left_below', options: { seconds: 10 }, style: { bgcolor: RED, color: WHITE } }],
		'14',
	)
	presets.add_marker = button('Video and audio', 'Add marker here', '+ marker', [
		{ actionId: 'add_marker', options: { label: '' } },
	])
	for (let m = 1; m <= 4; m++) {
		presets[`marker_${m}`] = button(
			'Markers',
			`Jump to marker ${m}`,
			`M${m}\\n${v(`marker_${m}`)}`,
			[{ actionId: 'jump_marker', options: { marker: m } }],
			[],
			'7',
		)
	}
	for (let p = 1; p <= 4; p++) {
		presets[`pulpit_page_${p}`] = button('Pulpit tablet', `Pulpit page ${p}`, `Pulpit\\npage ${p}`, [
			{ actionId: 'pulpit_page', options: { page: p } },
		])
	}
	presets.pulpit_selected = button(
		'Pulpit tablet',
		'Show the selected guest on the pulpit',
		`To pulpit:\\n${v('selected_guest_name')}`,
		[{ actionId: 'send_pulpit', options: { guest: 0 } }],
		[
			{
				feedbackId: 'guest_on_pulpit',
				options: { guest: 0 },
				style: { bgcolor: combineRgb(0, 120, 60), color: WHITE },
			},
		],
		'7',
	)
	return presets
}

module.exports = { presetDefinitions }
