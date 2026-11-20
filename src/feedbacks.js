const { combineRgb } = require('@companion-module/base')

const RED = combineRgb(200, 0, 0)
const ORANGE = combineRgb(230, 130, 0)
const BLUE = combineRgb(0, 80, 180)
const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)

function feedbackDefinitions(self) {
	const c = self.client
	const guestOf = (opt) => (opt.guest > 0 ? opt.guest : self.selectedGuest)
	const guestOption = {
		type: 'number',
		id: 'guest',
		label: 'Guest number (0 = the selected guest)',
		default: 0,
		min: 0,
		max: 64,
	}
	const fileOption = { type: 'number', id: 'file', label: 'File number', default: 1, min: 1, max: 999 }
	const assetAt = (opt) => {
		const a = c.fileAt(guestOf(opt), opt.file)
		return a ? a.id : 0
	}

	return {
		file_live: {
			type: 'boolean',
			name: 'File is live',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [guestOption, fileOption],
			callback: (fb) => c.isLive(assetAt(fb.options)),
		},
		file_pending: {
			type: 'boolean',
			name: 'File is being sent to vMix',
			defaultStyle: { bgcolor: ORANGE, color: BLACK },
			options: [guestOption, fileOption],
			callback: (fb) => c.isPending(assetAt(fb.options)),
		},
		guest_selected: {
			type: 'boolean',
			name: 'Guest is selected',
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			options: [{ type: 'number', id: 'guest', label: 'Guest number', default: 1, min: 1, max: 64 }],
			callback: (fb) => self.selectedGuest === fb.options.guest,
		},
		guest_live: {
			type: 'boolean',
			name: 'Something of this guest is live',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [{ type: 'number', id: 'guest', label: 'Guest number', default: 1, min: 1, max: 64 }],
			callback: (fb) => c.files(fb.options.guest).some((a) => c.isLive(a.id)),
		},
		guest_on_pulpit: {
			type: 'boolean',
			name: 'Guest is shown on the pulpit tablet',
			defaultStyle: { bgcolor: combineRgb(0, 120, 60), color: WHITE },
			options: [guestOption],
			callback: (fb) => {
				const g = guestOf(fb.options)
				return c.pulpitScreens().some((s) => c.guestNumberOfSet(s.current_set_id) === g)
			},
		},
		live_kind: {
			type: 'boolean',
			name: 'What is live',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [
				{
					type: 'dropdown',
					id: 'kind',
					label: 'Kind',
					default: 'video',
					choices: [
						{ id: 'none', label: 'Nothing (default input)' },
						{ id: 'photo', label: 'Photo' },
						{ id: 'video', label: 'Video' },
						{ id: 'audio', label: 'Audio' },
						{ id: 'any', label: 'Anything' },
					],
				},
			],
			callback: (fb) => {
				const k = c.liveKind()
				return fb.options.kind === 'any' ? k !== 'none' : k === fb.options.kind
			},
		},
		paused: {
			type: 'boolean',
			name: 'Video/audio is paused',
			defaultStyle: { bgcolor: ORANGE, color: BLACK },
			options: [],
			callback: () => {
				const p = c.playing()
				return !!(p && p.paused)
			},
		},
		playing: {
			type: 'boolean',
			name: 'Video/audio is playing',
			defaultStyle: { bgcolor: combineRgb(0, 140, 0), color: WHITE },
			options: [],
			callback: () => {
				const p = c.playing()
				return !!(p && !p.paused)
			},
		},
		time_left_below: {
			type: 'boolean',
			name: 'Time left is below',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [{ type: 'number', id: 'seconds', label: 'Seconds', default: 10, min: 1, max: 3600 }],
			callback: (fb) => {
				const p = c.playing()
				return !!(p && p.durationMs && p.durationMs - p.positionMs < fb.options.seconds * 1000)
			},
		},
		offline: {
			type: 'boolean',
			name: 'Agent connection lost',
			description: 'True while Companion is not connected to the agent or vMix is not reachable',
			defaultStyle: { bgcolor: combineRgb(90, 90, 90), color: combineRgb(255, 200, 0) },
			options: [],
			callback: () => !c.connected || !c.engine().vmix_ok,
		},
	}
}

module.exports = { feedbackDefinitions }
