# Chrome Extension Message System

This repository shows how to make requests between
content, background and popup scripts of a chrome extension.

## How to build?

Build the script once.

	npm i
	npm run build

Recompile in save:

	npm i
	npm start

In chrome go to "chrome://extensions", press Add Extracted Extension
(or something like that, I don't know the english translation)
and select the build folder which has appeared in the directory.

## The main Concept

The main idea is that every script has a router which can
send messages or tasks to other routers.

	import { Router, Destinations, Task } from "./connection"
	const router = new Router(Destinations.BACKGROUND)

If you want to use this system the background script must always have
exactly one router, which works as a root node in a star topology.
Therefore it is the broker for every other router.

Routers can send messages to each other or tasks.
A task has an ID and a payload:

	const task = new Task("ID", { /* payload */ })

It can be executed by specifying a target and passing it to the router:

	const dest = router.run(Destinations.CONTENT)
	const result = (await dest(task)).getPayload()

It will return a message from the handler.
A handler can be specified like this:

	router.handle("ID", async (task) => {
		/* do something */
		return { /* response */ };
	})

This handler waits for the task with the id "ID".
Commonly you would place the handler e.g. in the background script
and run the task from the content script.
