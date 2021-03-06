A library and framework for implmenting the cqrs pattern without a lot of boilerplate and over head.

## Vscode snippets

These snippets will make your life easier! Add them to your user snippets and start hacking away!

### Command:

This snippet will allow you to rapidly create a command, event and command handler

```json
"command-handler": {
  "prefix": "command",
  "description": "Created a command handler",
  "body": [
    "import { CQEvent, CommandHandler, CQResult, createEvent } from \"scq\"",
    "",
    "export type $2 = CQEvent<\"$2\"> & $1",
    "export type $1 = {",
    "\t$0",
    "};",
    "",
    "CommandHandler<$1>(\"$1\", req => {",
    "",
    "\tconst $3 = createEvent<$2>(\"$2\", req)",
    "",
    "\treturn CQResult.fromEvents([$3])",
    "})",
    ""
  ]
}
```

### Events:

This snippet will allow you to easily create an aggregated event type

```json
"events": {
  "prefix": "events",
  "description": "Creates a set of events",
  "body": [
    "export type $1Event = (",
    "\t",
    ")",
    "export type $1EventProperty = (",
    "\t",
    ")",
    "export const $1EventNames: ReadonlyArray<$1Event[\"name\"]> = [",
    "\t",
    "]"
  ]
}
```

___

## How do I use it?

For simplicity sake, here is a mostly complete sample.

[FullExample](./examples/FullExample.ts)
```typescript
import * as express from "express"
import { json } from "body-parser";
import { createLocalPubsub, withEvents, CommandHandler, CQResult, createEvent, CQEvent, EventHandler, QueryHandler, createEventQueryBuilder, Rule } from "scq"
import { createIndex, createMongooseEventStore } from "scq/mongoose"
import { withQueries, withCommands } from "scq/express"

const validColors = new Set<string>([
  "red",
  "green",
  "blue"
])
type DoSillyThing = {
  color: string
};
const colorMustBeValid: Rule<DoSillyThing> = ({ color }) => {
  if (validColors.has(color)) {
    return []
  }

  return [`color must be one of [${Array.from(validColors).join(", ")}]`]
}
CommandHandler<DoSillyThing>("DoSillyThing", req => {

  const happened = createEvent<SillyThingHappened>("SillyThingHappened", req)

  return CQResult.fromEvent(happened)
}).withRule(colorMustBeValid)

type SillyThingHappened = CQEvent<"SillyThingHappened"> & {
  color: string
};
EventHandler<SillyThingHappened>("SillyThingHappened", event => {

  console.info(`A silly thing happend with the color ${event.color}.`)
})

type FindSillyThingEvents = {
  skip?: number
  take?: number

  color?: string
};
QueryHandler<FindSillyThingEvents>("FindSillyThingEvents", async req => {

  const query = createEventQueryBuilder<SillyThingHappened>()
    .setSkip(req.skip)
    .setTake(req.take)
    .setProperty("color", req.color)
    .build()

  const events = await store.query(query)

  return CQResult.fromEvents(events)
})

/////////
// App //
/////////

const store = createMongooseEventStore({
  connectionString: "mongodb://root:password@localhost:27017/eccom?authSource=admin&w=1",
  indices: [
    createIndex<SillyThingHappened>({
      color: "asc"
    })
  ]
})
const pubsub = createLocalPubsub({

})
const app = express()

// Commands

// To load command handlers from directory: 
// loadHandlers({
//   directory: resolve(__dirname, "commands")
// })
app.post("/commands/:commandName", json(), withCommands({
  paramName: "commandName",

  store,
  pubsub
}))

// Queries

// To load query handlers from directory:
// loadHandlers({
//   directory: resolve(__dirname, "queries")
// })
app.post("/queries/:queryName", json(), withQueries({
  paramName: "queryName",

  // it is important that if you add a store or pubsub to the queries that you add a filter too.
  // otherwise you will end up saving or processing your events again.
}))

// Events

// To load event handlers from directory:
// loadHandlers({
//   directory: resolve(__dirname, "events")
// })
withEvents({
  pubsub
})

// Start it up!
app.listen(3000,
  () => {
    console.info(`server is available at http://localhost:3000`)

    // Since this is a test server, we exit
    process.exit(0)
  })
```
