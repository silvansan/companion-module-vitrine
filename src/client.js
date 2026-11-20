// Talks to the Vitrine agent on the vMix PC: one HTTP bootstrap for the
// catalog, then a WebSocket for live state. Works without Companion, so it
// can be tested on its own (see test/).
const { EventEmitter } = require('node:events')

const KINDS = { photo: 'PHOTO', video: 'VIDEO', audio: 'AUDIO' }

function mmss(ms) {
	if (!ms || ms < 0) ms = 0
	const total = Math.floor(ms / 1000)
	const h = Math.floor(total / 3600)
	const m = Math.floor((total % 3600) / 60)
	const s = String(total % 60).padStart(2, '0')
	return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

class VitrineClient extends EventEmitter {
	constructor() {
		super()
		this.catalog = null // what /api/bootstrap returns
		this.status = null // the latest "state" message
		this.connected = false
		this.ws = null
		this.timer = null
		this.stopped = true
		this.lastPosAt = 0
	}

	configure({ host, port, apiKey }) {
		this.base = `http://${host || '127.0.0.1'}:${port || 8090}`
		this.apiKey = (apiKey || '').trim()
	}

	start() {
		this.stop()
		this.stopped = false
		this.connect()
	}

	stop() {
		this.stopped = true
		clearTimeout(this.timer)
		if (this.ws) {
			try {
				this.ws.close()
			} catch {
				// already closed
			}
			this.ws = null
		}
		this.setConnected(false, '')
	}

	setConnected(ok, error) {
		const changed = ok !== this.connected || error !== this.error
		this.connected = ok
		this.error = error
		if (changed) this.emit('connection', ok, error)
	}

	retry(delay) {
		if (this.stopped) return
		clearTimeout(this.timer)
		this.timer = setTimeout(() => this.connect(), delay)
	}

	async connect() {
		if (this.stopped) return
		if (!this.apiKey) {
			this.setConnected(false, 'No API key. Create one on the agent settings page (Integrations).')
			return
		}
		try {
			await this.loadCatalog()
		} catch (e) {
			this.setConnected(false, e.message)
			this.retry(5000)
			return
		}
		const url = this.base.replace(/^http/, 'ws') + '/ws?key=' + encodeURIComponent(this.apiKey)
		let ws
		try {
			ws = new WebSocket(url)
		} catch (e) {
			this.setConnected(false, e.message)
			this.retry(5000)
			return
		}
		this.ws = ws
		ws.onopen = () => this.setConnected(true, '')
		ws.onmessage = (ev) => this.onMessage(ev.data)
		ws.onclose = () => {
			if (this.ws !== ws) return
			this.ws = null
			this.setConnected(false, 'Connection to the agent closed')
			this.retry(2000)
		}
		ws.onerror = () => {
			// onclose follows
		}
	}

	async request(method, path, body) {
		const res = await fetch(this.base + path, {
			method,
			headers: { Authorization: 'Bearer ' + this.apiKey, 'Content-Type': 'application/json' },
			body: body ? JSON.stringify(body) : undefined,
			signal: AbortSignal.timeout(5000),
		})
		let data = {}
		try {
			data = await res.json()
		} catch {
			// empty body
		}
		if (res.status === 401) throw new Error('The API key was refused. Create a new one on the agent settings page.')
		if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
		return data
	}

	post(path, body) {
		return this.request('POST', path, body || {})
	}

	async loadCatalog() {
		this.catalog = await this.request('GET', '/api/bootstrap')
		if (this.catalog.status) this.status = this.catalog.status
		this.emit('catalog')
		this.emit('state')
	}

	onMessage(raw) {
		let msg
		try {
			msg = JSON.parse(raw)
		} catch {
			return
		}
		if (msg.type === 'state') {
			this.status = msg
			this.emit('state')
		} else if (msg.type === 'catalog') {
			this.loadCatalog().catch(() => {})
		} else if (msg.type === 'screens' && this.catalog) {
			this.catalog.screens = msg.screens
			this.emit('catalog')
		} else if (msg.type === 'settings' && this.catalog) {
			this.catalog.settings = msg.settings
		}
	}

	// ---------- reading the catalog ----------

	engine() {
		return (this.status && this.status.engine) || {}
	}

	guests() {
		return (this.catalog && this.catalog.sets) || []
	}

	guestName(set) {
		return set ? set.guest || set.title || 'Guest' : ''
	}

	asset(id) {
		return this.catalog && this.catalog.assets ? this.catalog.assets[String(id)] : null
	}

	// Files of guest n (1-based) in tablet order, only those on this PC.
	files(n) {
		const set = this.guests()[n - 1]
		if (!set) return []
		return set.items.map((id) => this.asset(id)).filter(Boolean)
	}

	fileAt(guest, file) {
		return this.files(guest)[file - 1] || null
	}

	guestNumberOfSet(setId) {
		const i = this.guests().findIndex((s) => s.id === setId)
		return i < 0 ? 0 : i + 1
	}

	// Where an asset sits as guest/file numbers (first match).
	locate(assetId) {
		const sets = this.guests()
		for (let g = 0; g < sets.length; g++) {
			const f = this.files(g + 1).findIndex((a) => a.id === assetId)
			if (f >= 0) return { guest: g + 1, file: f + 1 }
		}
		return { guest: 0, file: 0 }
	}

	pulpitScreens() {
		return ((this.catalog && this.catalog.screens) || []).filter((s) => s.role === 'pulpit')
	}

	// What the transport (play/pause/seek) acts on: the live video or audio card,
	// otherwise an audio file playing behind the default input.
	playing() {
		const e = this.engine()
		if (e.asset_id && (e.kind === 'video' || e.kind === 'audio')) {
			return { assetId: e.asset_id, positionMs: e.position_ms, durationMs: e.duration_ms, paused: e.paused }
		}
		const au = e.audio || {}
		if (au.asset_id) {
			return { assetId: au.asset_id, positionMs: au.position_ms, durationMs: au.duration_ms, paused: au.paused }
		}
		return null
	}

	isLive(assetId) {
		const e = this.engine()
		return !!assetId && (e.asset_id === assetId || (e.audio && e.audio.asset_id === assetId))
	}

	isPending(assetId) {
		const e = this.engine()
		return !!assetId && (e.pending_id === assetId || (e.audio && e.audio.pending_id === assetId))
	}

	// "none", "photo", "video" or "audio": what is on screen or playing now.
	liveKind() {
		const e = this.engine()
		if (e.asset_id) return e.kind || 'none'
		if (e.audio && e.audio.asset_id) return 'audio'
		return 'none'
	}

	// ---------- commands ----------

	take(guest, file, from) {
		return this.post('/api/take', { guest, file, from: from === 'resume' ? 'resume' : 'start' })
	}

	// Tap behaviour of the tablets: live → back to the default input, otherwise take it.
	async toggle(guest, file, from) {
		const a = this.fileAt(guest, file)
		if (!a) throw new Error(`Guest ${guest} has no file ${file}`)
		const e = this.engine()
		if (e.asset_id === a.id) return this.post('/api/clear')
		if (e.audio && e.audio.asset_id === a.id) return this.post('/api/audio/stop')
		return this.take(guest, file, from)
	}

	clear() {
		return this.post('/api/clear')
	}

	stopAudio() {
		return this.post('/api/audio/stop')
	}

	play() {
		return this.post('/api/play')
	}

	pause() {
		return this.post('/api/pause')
	}

	playPause() {
		const p = this.playing()
		if (!p) return Promise.resolve()
		return p.paused ? this.play() : this.pause()
	}

	seekTo(ms) {
		const p = this.playing()
		if (!p) return Promise.resolve()
		const max = p.durationMs ? Math.max(0, p.durationMs - 500) : ms
		return this.post('/api/seek', { position_ms: Math.max(0, Math.min(Math.round(ms), max)) })
	}

	seekBy(seconds) {
		const p = this.playing()
		if (!p) return Promise.resolve()
		return this.seekTo(p.positionMs + seconds * 1000)
	}

	markers(assetId) {
		const a = this.asset(assetId)
		return a && a.markers ? [...a.markers].sort((x, y) => x.t_ms - y.t_ms) : []
	}

	jumpToMarker(n) {
		const p = this.playing()
		if (!p) return Promise.resolve()
		const m = this.markers(p.assetId)[n - 1]
		if (!m) throw new Error(`This file has no marker ${n}`)
		return this.seekTo(m.t_ms)
	}

	addMarker(label) {
		const p = this.playing()
		if (!p) throw new Error('Nothing is playing')
		return this.post('/api/markers', { asset_id: p.assetId, t_ms: p.positionMs, label: label || '' })
	}

	sendToPulpit(guest) {
		return this.post('/api/pulpit', { guest })
	}

	async pulpitPage(page) {
		for (const sc of this.pulpitScreens()) {
			await this.post(`/api/screens/${sc.id}/command`, { action: 'goto_page', page: page - 1 })
		}
	}
}

module.exports = { VitrineClient, mmss, KINDS }
