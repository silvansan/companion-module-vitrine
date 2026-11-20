const { InstanceBase, InstanceStatus, runEntrypoint } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const { getConfigFields } = require('./config')
const { VitrineClient } = require('./client')
const { actionDefinitions } = require('./actions')
const { feedbackDefinitions } = require('./feedbacks')
const { variableDefinitions, variableValues } = require('./variables')
const { presetDefinitions } = require('./presets')

class VitrineInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.selectedGuest = 1
		this.client = new VitrineClient()
		this.client.on('connection', (ok, error) => {
			if (ok) this.updateStatus(InstanceStatus.Ok)
			else if (error && error.includes('API key')) this.updateStatus(InstanceStatus.BadConfig, error)
			else this.updateStatus(InstanceStatus.ConnectionFailure, error || 'Not connected')
			this.refresh()
		})
		this.client.on('catalog', () => {
			this.clampGuest()
			this.refresh()
		})
		this.client.on('state', () => this.refresh())
	}

	async init(config) {
		await this.configUpdated(config)
	}

	async configUpdated(config) {
		this.config = config
		this.guestCount = Math.max(1, Math.min(32, Number(config.guests) || 8))
		this.slotCount = Math.max(1, Math.min(64, Number(config.slots) || 16))
		this.setActionDefinitions(actionDefinitions(this))
		this.setFeedbackDefinitions(feedbackDefinitions(this))
		this.setVariableDefinitions(variableDefinitions(this))
		this.setPresetDefinitions(presetDefinitions(this))
		this.updateStatus(InstanceStatus.Connecting)
		this.client.configure({ host: config.host, port: config.port, apiKey: config.apiKey })
		this.client.start()
		this.refresh()
	}

	async destroy() {
		this.client.stop()
	}

	getConfigFields() {
		return getConfigFields()
	}

	selectGuest(n) {
		this.selectedGuest = Math.max(1, Number(n) || 1)
		this.clampGuest()
		this.refresh()
	}

	clampGuest() {
		const count = this.client.guests().length
		if (count > 0 && this.selectedGuest > count) this.selectedGuest = count
	}

	// Variables and feedbacks follow every state message (several per second
	// while a video plays), so only changed values are sent.
	refresh() {
		const values = variableValues(this)
		const changed = {}
		this.lastValues = this.lastValues || {}
		for (const [k, val] of Object.entries(values)) {
			if (this.lastValues[k] !== val) changed[k] = val
		}
		this.lastValues = values
		if (Object.keys(changed).length) this.setVariableValues(changed)
		this.checkFeedbacks()
	}
}

runEntrypoint(VitrineInstance, UpgradeScripts)
