import { Pubsub, CQEventHandler } from "./Core";
import { EventHandler } from "./Handlers";
import { Registrar } from "./HandlerRegistrar"

type Options = {
  pubsub: Pubsub

  onErrors?: (errors?: string[]) => void
}
export function createPubsubHandler(registrar: Registrar<CQEventHandler>): (options: Options) => void {

  return options => {
    const { pubsub, onErrors } = options

    const handleErrors = onErrors ?? (() => { })

    pubsub.subscribeToAll(async event => {
      const { name } = event

      try {
        const result = await registrar.dispatch(name, event)
        if (result?.errors) {
          handleErrors(result.errors)
        }
      } catch (err) {
        handleErrors([`${err.name}: ${err.message}`])
      }
    })
  }
}

export const withEvents = createPubsubHandler(EventHandler)
