import * as express from "express"
import { json } from "body-parser";
import { createLocalPubsub, withEvents, CommandHandler, CQResult, createEvent, CQEvent, EventHandler, QueryHandler, createEventQueryBuilder, Rule } from "../src"
import { createIndex, createMongooseEventStore } from "../mongoose"
import { withQueries, withCommands } from "../express"

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
