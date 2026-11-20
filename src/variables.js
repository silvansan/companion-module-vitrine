const { mmss, KINDS } = require('./client')

function shortName(name, max) {
	if (!name) return ''
	return name.length > max ? name.slice(0, max - 1) + '…' : name
}

function variableDefinitions(self) {
	const defs = [
		{ variableId: 'connected', name: 'Connected to the agent (true/false)' },
		{ variableId: 'vmix_ok', name: 'vMix reachable (true/false)' },
		{ variableId: 'service_name', name: 'Current service' },
		{ variableId: 'guest_count', name: 'Number of guests' },
		{ variableId: 'selected_guest', name: 'Selected guest number' },
		{ variableId: 'selected_guest_name', name: 'Selected guest name' },
		{ variableId: 'selected_file_count', name: 'Number of files of the selected guest' },
		{ variableId: 'live_kind', name: 'What is live: none, photo, video or audio' },
		{ variableId: 'live_name', name: 'Name of the live file' },
		{ variableId: 'live_guest', name: 'Guest number of the live file' },
		{ variableId: 'live_guest_name', name: 'Guest name of the live file' },
		{ variableId: 'live_file', name: 'File number of the live file' },
		{ variableId: 'on_screen_kind', name: 'What is on the projector mix: none, photo, video or audio' },
		{ variableId: 'audio_playing', name: 'An audio file plays behind the default input (true/false)' },
		{ variableId: 'playing', name: 'A video or audio is playing and not paused (true/false)' },
		{ variableId: 'paused', name: 'The video/audio is paused (true/false)' },
		{ variableId: 'position', name: 'Position (m:ss)' },
		{ variableId: 'duration', name: 'Duration (m:ss)' },
		{ variableId: 'time_left', name: 'Time left (m:ss)' },
		{ variableId: 'time_left_s', name: 'Time left in seconds' },
		{ variableId: 'marker_count', name: 'Markers of the playing file' },
		{ variableId: 'pulpit_guest', name: 'Guest number shown on the pulpit tablet' },
		{ variableId: 'pulpit_guest_name', name: 'Guest name shown on the pulpit tablet' },
	]
	for (let i = 1; i <= self.guestCount; i++) {
		defs.push({ variableId: `guest_${i}`, name: `Guest ${i} name` })
	}
	for (let i = 1; i <= self.slotCount; i++) {
		defs.push({ variableId: `slot_${i}_name`, name: `Selected guest, file ${i}: name` })
		defs.push({ variableId: `slot_${i}_kind`, name: `Selected guest, file ${i}: photo/video/audio` })
		defs.push({ variableId: `slot_${i}_label`, name: `Selected guest, file ${i}: button text` })
		defs.push({ variableId: `slot_${i}_duration`, name: `Selected guest, file ${i}: duration (m:ss)` })
	}
	for (let i = 1; i <= 8; i++) {
		defs.push({ variableId: `marker_${i}`, name: `Playing file, marker ${i} label` })
	}
	return defs
}

function variableValues(self) {
	const c = self.client
	const v = {}
	const guests = c.guests()
	const e = c.engine()
	const sel = self.selectedGuest
	const files = c.files(sel)

	v.connected = c.connected ? 'true' : 'false'
	v.vmix_ok = e.vmix_ok ? 'true' : 'false'
	v.service_name = (c.catalog && c.catalog.service && c.catalog.service.name) || ''
	v.guest_count = guests.length
	v.selected_guest = sel
	v.selected_guest_name = c.guestName(guests[sel - 1])
	v.selected_file_count = files.length

	for (let i = 1; i <= self.guestCount; i++) {
		v[`guest_${i}`] = c.guestName(guests[i - 1])
	}
	for (let i = 1; i <= self.slotCount; i++) {
		const a = files[i - 1]
		v[`slot_${i}_name`] = a ? a.name : ''
		v[`slot_${i}_kind`] = a ? a.kind : ''
		v[`slot_${i}_duration`] = a && a.duration_ms ? mmss(a.duration_ms) : ''
		let label = ''
		if (a) {
			label = (KINDS[a.kind] || '') + (a.duration_ms ? ' ' + mmss(a.duration_ms) : '') + '\n' + shortName(a.name, 24)
			if (!a.ready) label += '\n(syncing)'
		}
		v[`slot_${i}_label`] = label
	}

	const kind = c.liveKind()
	v.live_kind = kind
	v.on_screen_kind = e.asset_id ? e.kind || 'none' : 'none'
	v.audio_playing = e.audio && e.audio.asset_id ? 'true' : 'false'
	const liveId = e.asset_id || (e.audio && e.audio.asset_id) || 0
	const liveAsset = c.asset(liveId)
	v.live_name = liveAsset ? liveAsset.name : ''
	const where = liveId ? c.locate(liveId) : { guest: 0, file: 0 }
	v.live_guest = where.guest || ''
	v.live_guest_name = where.guest ? c.guestName(guests[where.guest - 1]) : ''
	v.live_file = where.file || ''

	const p = c.playing()
	v.playing = p && !p.paused ? 'true' : 'false'
	v.paused = p && p.paused ? 'true' : 'false'
	v.position = p ? mmss(p.positionMs) : ''
	v.duration = p ? mmss(p.durationMs) : ''
	const left = p ? Math.max(0, (p.durationMs || 0) - (p.positionMs || 0)) : 0
	v.time_left = p ? mmss(left) : ''
	v.time_left_s = p ? Math.ceil(left / 1000) : ''
	const markers = p ? c.markers(p.assetId) : []
	v.marker_count = markers.length
	for (let i = 1; i <= 8; i++) {
		v[`marker_${i}`] = markers[i - 1] ? markers[i - 1].label : ''
	}

	const pulpit = c.pulpitScreens()[0]
	const pg = pulpit ? c.guestNumberOfSet(pulpit.current_set_id) : 0
	v.pulpit_guest = pg || ''
	v.pulpit_guest_name = pg ? c.guestName(guests[pg - 1]) : ''
	return v
}

module.exports = { variableDefinitions, variableValues }
