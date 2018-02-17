// @flow
import "babel-polyfill"
import { Router, Task, Destinations } from "./connection"

const router = new Router(Destinations.CONTENT)

/***************************************************/
/* Sending the token after authentication.         */
/***************************************************/

//this is a function which sends a task to the background script
const notify = async () => {

	//TODO first extract the token from somewhere
	const handle_token = new Task("AUTHENTICATED", {
		token: "my secret :D"
	})

	//define the background script as destination
	const dest = router.run(Destinations.BACKGROUND)

	//run the task
	const { saved } = (await dest(handle_token)).getPayload()

	//handle response
	if(saved) {
		console.debug("Token successfully saved.")
	}
}

/***************************************************/
/* Requesting the token if the page becomes active.*/
/***************************************************/

//this is a function which sends a task to the background script
const request = async () => {

	const request_token = new Task("GET_TOKEN")

	//define the background script as destination
	const dest = router.run(Destinations.BACKGROUND)

	//run the task
	const { token } = (await dest(request_token)).getPayload()

	//handle response
	if(token !== undefined) {
		console.debug("Token successfully requested: " + token)
	}
}

/***************************************************/
/* Handle token changes                            */
/***************************************************/

//This is just an example how it could be done!!!
//It does not work.
//However broadcast functionality is not implemented yet
//into the connection system.
//react to token change
router.handle("TOKEN_CHANGE", async (task: Task) => {
	//do something with the token
	console.log(task.getPayload().token)

	return { };
})

/***************************************************/
/* Run both tasks                                  */
/***************************************************/

const run = async () => {
	await notify()
	await request()
}

run()
