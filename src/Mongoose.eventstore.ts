import * as mongoose from "mongoose"
import { EventStore, EventQuery, CQEvent } from "./Core"

// Fixes: https://github.com/Automattic/mongoose/issues/6890
mongoose.set('useCreateIndex', true)

type Index = Record<string, "asc" | "desc"> & { unique?: boolean }
export function createIndex<TObj>(props: Partial<Record<keyof TObj, "asc" | "desc">>, unique = false): Index {
  return {
    ...props,
    unique
  }
}

type Options = {
  indices: Index[]
  connectionString: string
  collectionName?: string
}
export function createMongooseEventStore(opts: Options): EventStore {

  const { indices, connectionString, collectionName } = opts

  mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  const eventSchema = new mongoose.Schema<CQEvent<string>>({
    id: String,
    name: String,
    when: Date,
  }, {
    strict: false,
    _id: false,
    id: false
  })
  eventSchema.set("toJSON", {

    virtuals: false,
    versionKey: false,
  })

  const allIndices = [
    createIndex<CQEvent<string>>({ id: "asc" }, true),
    createIndex<CQEvent<string>>({ name: "asc" }),
    createIndex<CQEvent<string>>({ when: "asc" }),
    ...indices
  ]
  allIndices.forEach(index => {
    const { unique, ...moreIndex } = index

    const mappedIndex = Object.keys(moreIndex)
      .reduce((acc, name) => ({
        ...acc,
        [name]: index[name] === "asc" ? 1
          : -1
      }), {} as Record<string, number>)

    eventSchema.index(mappedIndex, {
      unique: unique === true
    })
  })

  const EventModel = mongoose.model(collectionName ?? "Events", eventSchema)

  return {
    async append<TEvent extends CQEvent<string>>(eventOrEvents: TEvent | TEvent[]) {
      type TDoc = TEvent & mongoose.Document

      let events = Array.isArray(eventOrEvents) ? eventOrEvents
        : [eventOrEvents]

      events = (await EventModel.insertMany(events)) as TDoc[]

      return Array.isArray(eventOrEvents) ? events
        : events[0]
    },

    async query<TEvent extends CQEvent<string>>(query: EventQuery<TEvent>) {
      type TDoc = TEvent & mongoose.Document

      const { skip, take, properties } = query

      const events = (await EventModel.find(properties, null, {
        skip: typeof skip === "number" && !isNaN(skip) ? skip
          : undefined,
        take: typeof take === "number" && !isNaN(take) ? take
          : undefined
      })) as TDoc[]

      return events
    }
  }
}
