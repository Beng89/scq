import { Pubsub, CQEventHandler } from "./Core";
import { EventHandler } from "./Handlers";
import { Registrar } from "./HandlerRegistrar"

type Options = {
  pubsub: Pubsub
}
export function createPubsubHandler(registrar: Registrar<CQEventHandler>): (options: Options) => void {

  return options => {
    const { pubsub } = options

    pubsub.subscribeToAll(async event => {
      const { name } = event

      const guard = registrar.findGuard(name) ?? (() => [])
      const handler = registrar.findHandler(name) ?? false
      if (handler === false) {
        return
      }

      const errors = await guard(event)
      if (errors.length === 0) {
        await handler(event)
      }
    })
  }
}

export const withEvents = createPubsubHandler(EventHandler)
