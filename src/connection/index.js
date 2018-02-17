// @flow

export const Destinations = {
	NIRVANA: 0,
	CONTENT: 1,
	BACKGROUND: 2
}

export type Destination = number;

export class Message {
	_origin: Destination
	_payload: Object
	_destination: Destination

	constructor(origin: Destination, destination: Destination, payload: Object) {
		this._origin = origin
		this._payload = payload
		this._destination = destination
	}

	getOrigin(): Destination {
		return this._origin
	}

	getPayload(): Object {
		return this._payload
	}

	getDestination(): Destination {
		return this._destination
	}

	setDestination(destination: Destination) {
		this._destination = destination
	}

	pack(): Object {
		return {
			origin: this._origin,
			payload: this._payload,
			destination: this._destination
		}
	}

	static unpack(object: Object) {
		let { origin, destination, payload } = object
		if(origin === undefined) {
			throw new Error("No origin provided.")
		}
		if(destination === undefined) {
			throw new Error("No destination provided.")
		}
		if(!payload) {
			console.warn("No payload provided.")
			payload = { }
		}
		return new Message(origin, destination, payload)
	}
}

/**
 * A task can be send from the main background
 * script to any tab.
 * The tab can than react and work as a slave.
 */
export class Task {

	_type: string
	_payload: Object

	constructor(type: string, payload: Object = {}) {
		this._type = type
		this._payload = payload
	}

	pack(): Object {
		return {
			type: this._type,
			payload: this._payload
		}
	}

	static unpack(task: Object) {
		let { type, payload } = task
		if(!type) {
			throw new Error("Undefined type", task)
		}
		if(!payload) {
			console.warn(`Task has no payload: ${ type }`)
			payload = { }
		}
		return new Task(type, payload)
	}

	getType(): string {
		return this._type
	}

	getPayload(): Object {
		return this._payload
	}
}

export class Result {

	_payload: Object
	_task: Task

	constructor(task: Task, payload: Object = { }) {
		this._task = task
		this._payload = payload
	}

	pack(): Object {
		return {
			task: this._task.pack(),
			payload: this._payload
		}
	}

	static unpack(result: Object) {
		let { task, payload } = result
		if(!task) {
			throw new Error("No task defined")
		}
		if(!payload) {
			console.warn(`No payload defined for task: ${ task.getType() }`)
			payload = {}
		}
		return new Result(Task.unpack(task), payload)
	}

	getTask(): Task {
		return this._task
	}

	getPayload(): Object {
		return this._payload
	}
}

// $FlowIgnore
export function browser(): any {
	if(!!chrome) {
		return chrome
	} else if(!!browser) {
		return browser
	} else {
		throw new Error("Unsupported browser.")
	}
}

export const execute = (callback: Function) => (...args: Array<*>) => {
	if(chrome) {
		return new Promise(resolve => callback(...args, resolve))
	} else {
		return callback(...args)
	}
}

export const queryTabs = (query: Object = { }) => execute(browser().tabs.query)(query)

/**
 * Get an array of all tabs.
 */
export const getTabs = () => queryTabs()

/**
 * Get the tab which is currently active.
 */
export const getActiveTab = async () => {
	const tabs = await queryTabs({ active: true, currentWindow: true })
	if(tabs[0]) {
		return tabs[0]
	} else {
		throw new Error("No tab exists.")
	}
}

export const sendToBackground = (object: Object) => {
	const send = browser().extension ?
		browser().extension.sendMessage :
		browser().runtime.sendMessage
	return execute(send)(object)
}

export const sendToContent = async (object: Object) => {
	const send = browser().tabs.sendMessage
	const tab = await getActiveTab()
	return execute(send)(tab.id, object)
}

export const respond = (protocol: Function) => (response: Object) => {
	try {
		protocol(response)
	} catch(e) {
		console.warn("Could not send a response.")
	}
}
	

export class Router {

	_handlers: Map<string, (task: Task, router: Router) =>
		Promise<Object | typeof undefined>> = new Map

	_myDestination: Destination

	constructor(destination: Destination) {
		this._myDestination = destination
		browser().runtime.onMessage.addListener(
			(object, _, respond) =>
				this.handleMessage(object, respond)
		)
	}

	handleMessage(object: Object, protocol: Function) {
		// unpack
		const message = Message.unpack(object)
		// check if message should be handled
		if(message.getDestination() === this._myDestination) {
			// get task
			const task = Task.unpack(message.getPayload())
			// get handler
			const handler = this._handlers.get(task.getType())
			if(handler) {
				//run handler
				handler(task, this)
					.then(rawResult => {
						const result = new Result(task, rawResult)
						const response = new Message(
							this._myDestination,
							message.getOrigin(),
							result.pack()
						)
						// return result
						respond(protocol)(response.pack())
					})
			} else {
				throw new Error("No handler specified.")
			}
		} else {
			// delegate
			this.send(message)
				.then(response => {
					respond(protocol)(response.pack())
				})
		}
		return true
	}

	handle(
		type: string,
		handler: (task: Task, router: Router) => Promise<Object | typeof undefined>
	) {
		this._handlers.set(type, handler)
	}

	async send(message: Message): Promise<Message> {
		const data = message.pack()
		let response
		if(this._myDestination === Destinations.BACKGROUND) {
			switch(message.getDestination()) {
			case Destinations.CONTENT:
				response = await sendToContent(data)
				break
			case Destinations.NIRVANA:
				//Sending message into the mighty nirvana
				break
			default:
				throw new Error("Unknown Destination")
			}
		} else {
			response = await sendToBackground(data)
		}
		if(!response)
			response = new Message(Destinations.NIRVANA, Destinations.NIRVANA, { }).pack()
		return Message.unpack(response)
	}

	run(destination: Destination) {
		return async (task: Task): Promise<?Result> => {
			const message = new Message(this._myDestination, destination, task.pack())
			const response = await this.send(message)
			if(response) {
				return Result.unpack(response.getPayload())
			}
		}
	}
}

