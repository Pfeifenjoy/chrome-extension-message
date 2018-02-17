// @flow
import "babel-polyfill"
import { Destinations, Router, Task } from "./connection"

console.debug("Starting background script")

// global object which represents the background script like a server
const router = new Router(Destinations.BACKGROUND)

//receive authentication
router.handle("AUTHENTICATED", async (task: Task) => {
	//unpack the token
	const token = task.getPayload().token
	console.debug("Receive token in background script: " + token)

	//TODO save token
	//TODO broadcast token change
	//This is not implemented yet in the message system.
	//A temporary solution would be to always poll the tab
	//when it becomes active.

	//return some status
	return { saved: true }
})

//receive authentication
router.handle("GET_TOKEN", async (task: Task) => {
	console.debug("requesting token")
	//TODO maybe check legitimacy
	
	//TODO load token
	const token = "dummy"
	
	//return some status
	return { token }
})
