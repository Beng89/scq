import { EventEmitter } from "events"
import { CQEvent, Pubsub, PubsubSubscription, CQEventHandler } from "./Core"

const createSubscription: <TKey extends string>(source: Pubsub, handlers: Map<TKey, CQEventHandler[]>, name: TKey, handler: CQEventHandler) => PubsubSubscription = (source, handlers, name, handler) => ({
  source,
  unsubscribe() {
    let fns = handlers.get(name) ?? []

    fns = fns.filter(other => other !== handler)

    handlers.set(name, fns)
  }
})

type Options = {
  channel?: string | symbol
}
export const createLocalPubsub: (options: Options) => Pubsub = options => {

  const { channel } = options

  const channelName = channel ?? Symbol.for(`local-events-${Date.now()}`)
  const emitter = new EventEmitter()

  const globalHandlers = new Map<"*", CQEventHandler[]>()
  const handlersByName = new Map<string, CQEventHandler[]>()

  emitter.on(channelName, (e: CQEvent<string>) => {
    // case-insensitive lookups
    const name = (e?.name ?? "").toLowerCase()

    const handlers = [
      ...(globalHandlers.get("*") ?? []),
      ...(handlersByName.get(name) ?? [])
    ];

    handlers.forEach(handler => handler(e))
  })

  return {
    async publish<TEvent extends CQEvent<string>>(eventOrEvents: TEvent | TEvent) {

      const events = Array.isArray(eventOrEvents) ? eventOrEvents
        : [eventOrEvents]

      events.forEach(event => emitter.emit(channelName, event))

      return eventOrEvents
    },
    subscribeTo(name, handler) {

      // case-insensitive lookups
      name = name.toLowerCase()

      const handlers = handlersByName.get(name) ?? []

      handlersByName.set(name, handlers.concat(handler))

      return createSubscription(this, handlersByName, name, handler)
    },
    subscribeToAll(handler) {

      const handlers = globalHandlers.get("*") ?? []

      globalHandlers.set("*", handlers.concat(handler))

      return createSubscription<"*">(this, globalHandlers, "*", handler)
    }
  }
}
