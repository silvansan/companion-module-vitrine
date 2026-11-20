// Unit tests with a made-up catalog. For a live test against a running agent:
//   VITRINE_HOST=127.0.0.1 VITRINE_KEY=vik_... node --test test/
const test = require('node:test')
const assert = require('node:assert')
const { VitrineClient, mmss } = require('../src/client')

function fakeClient() {
	const c = new VitrineClient()
	c.catalog = {
		sets: [
			{ id: 10, guest: 'Daniel', items: [5, 6] },
			{ id: 11, guest: 'Maria', items: [3, 99, 2] }, // 99 is not on this PC
		],
		assets: {
			5: { id: 5, kind: 'photo', name: 'Welcome', markers: [] },
			6: {
				id: 6,
				kind: 'video',
				name: 'Trip',
				duration_ms: 90000,
				markers: [
					{ id: 1, label: 'B', t_ms: 50000 },
					{ id: 2, label: 'A', t_ms: 20000 },
				],
			},
			3: { id: 3, kind: 'audio', name: 'Song', duration_ms: 200000, markers: [] },
			2: { id: 2, kind: 'photo', name: 'Group', markers: [] },
		},
		screens: [{ id: 'p1', role: 'pulpit', current_set_id: 11 }],
	}
	c.status = {
		engine: { asset_id: 6, kind: 'video', position_ms: 30000, duration_ms: 90000, paused: false, audio: {} },
	}
	return c
}

test('files skip assets that are not on this PC', () => {
	const c = fakeClient()
	assert.deepStrictEqual(
		c.files(2).map((a) => a.id),
		[3, 2],
	)
	assert.strictEqual(c.fileAt(2, 2).id, 2)
	assert.strictEqual(c.fileAt(3, 1), null)
})

test('live kind, location and markers', () => {
	const c = fakeClient()
	assert.strictEqual(c.liveKind(), 'video')
	assert.deepStrictEqual(c.locate(6), { guest: 1, file: 2 })
	assert.deepStrictEqual(
		c.markers(6).map((m) => m.label),
		['A', 'B'],
	)
	assert.strictEqual(c.guestNumberOfSet(c.pulpitScreens()[0].current_set_id), 2)
	c.status.engine = { asset_id: 0, audio: { asset_id: 3, position_ms: 1000, duration_ms: 200000 } }
	assert.strictEqual(c.liveKind(), 'audio')
	assert.strictEqual(c.playing().assetId, 3)
	c.status.engine = { asset_id: 0, audio: {} }
	assert.strictEqual(c.liveKind(), 'none')
	assert.strictEqual(c.playing(), null)
})

test('toggle clears when the file is live, else takes it', async () => {
	const c = fakeClient()
	const calls = []
	c.post = async (path, body) => calls.push([path, body])
	await c.toggle(1, 2, 'start')
	await c.toggle(1, 1, 'resume')
	await c.seekBy(-60)
	await c.jumpToMarker(2)
	assert.deepStrictEqual(calls, [
		['/api/clear', undefined],
		['/api/take', { guest: 1, file: 1, from: 'resume' }],
		['/api/seek', { position_ms: 0 }],
		['/api/seek', { position_ms: 50000 }],
	])
})

test('mmss', () => {
	assert.strictEqual(mmss(65000), '1:05')
	assert.strictEqual(mmss(3725000), '1:02:05')
})

test('live agent', { skip: !process.env.VITRINE_KEY }, async () => {
	const c = new VitrineClient()
	c.configure({ host: process.env.VITRINE_HOST || '127.0.0.1', port: 8090, apiKey: process.env.VITRINE_KEY })
	const connected = new Promise((resolve) => c.on('connection', (ok) => ok && resolve()))
	c.start()
	await connected
	assert.ok(c.guests().length > 0)
	await c.take(1, 1, 'start')
	await new Promise((r) => setTimeout(r, 1500))
	assert.strictEqual(c.engine().asset_id, c.fileAt(1, 1).id)
	await c.toggle(1, 1)
	await new Promise((r) => setTimeout(r, 1500))
	assert.strictEqual(c.liveKind(), 'none')
	c.stop()
})
