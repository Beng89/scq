import { CQEvent, EventStore, Registrar, Pubsub, CQHandler } from "."
import { CommandHandler, QueryHandler } from "./Handlers"
import { CQResult } from "./Core"

export type LocalInvokerOptions = {
  store?: EventStore
  canStore?: (e: CQEvent<string>) => boolean

  pubsub?: Pubsub
  canPublish?: (e: CQEvent<string>) => boolean
}
export function createLocalInvoker(registrar: Registrar<CQHandler>): (options: LocalInvokerOptions) => <TReq extends object>(name: string, body: TReq) => Promise<CQResult> | CQResult {

  return options => {
    const { pubsub, store } = options

    const canStore = typeof store === "undefined" ? () => false
      : typeof options.canStore === "function" ? options.canStore
        : () => true

    const canPublish: (command: CQEvent<string>) => boolean = typeof pubsub === "undefined" ? () => false
      : typeof options.canPublish === "function" ? options.canPublish
        : () => true

    return async (name, body) => {

      const start = Date.now()

      const result = await registrar.dispatch(name, body)
      if (result.errors.length > 0) {
        return result
      }

      // store
      const storable = result.events.filter(canStore)
      if (storable.length > 0) {
        await store.append(storable)
      }

      // publish
      const publishable = result.events.filter(canPublish)
      if (publishable.length > 0) {
        await pubsub.publish(publishable)
      }

      console.info(`invoked ${registrar.type} '${name}'. Took ${Date.now() - start}ms to execute.`)
      return result
    }
  }
}

export const invokeLocalCommand = createLocalInvoker(CommandHandler)
export const invokeLocalQuery = createLocalInvoker(QueryHandler)
