import { Response, RequestHandler } from "express"
import { inspect } from "util"
import { CQEvent, EventStore, Registrar, Pubsub, CQHandler } from "."
import { CommandHandler, QueryHandler } from "./Handlers"
import { RuleChain } from "./Rules"

export const sendResult = (res: Response, { events = new Array<object>(), errors = new Array<string>(), status = 200 }) => {
  res.status(status).json({
    errors,
    events
  })
}

type Options = {
  paramName: string,

  store?: EventStore
  canStore?: (e: CQEvent<string>) => boolean

  pubsub?: Pubsub
  canPublish?: (e: CQEvent<string>) => boolean
}
export function createCQExpressHandler(registrar: Registrar<CQHandler>): (options: Options) => RequestHandler {

  return options => {

    const { paramName, pubsub, store } = options

    const canStore = typeof store === "undefined" ? () => false
      : typeof options.canStore === "function" ? options.canStore
        : () => true

    const canPublish: (command: CQEvent<string>) => boolean = typeof pubsub === "undefined" ? () => false
      : typeof options.canPublish === "function" ? options.canPublish
        : () => true

    return async (req, res) => {

      let { [paramName]: name } = req.params

      // case-insensitive lookups
      name = typeof name === "string" ? name.toLowerCase()
        : ""

      const rules = registrar.findRules(name) ?? RuleChain.create<any>()
      const guard = registrar.findGuard(name) ?? (() => new Array<string>())
      const handler = registrar.findHandler(name) ?? false
      if (handler === false) {
        return sendResult(res, {
          status: 400,
          errors: [
            `A handler for the ${registrar.type} '${name}' does not exist`
          ]
        });
      }

      const start = Date.now()
      try {
        const { body } = req
        const errors = [
          ...(await rules.validate(body)),
          ...(await guard(body))
        ]
        if (Array.isArray(errors) && errors.length > 0) {
          return sendResult(res, {
            status: 400,
            errors,
          })
        }

        const result = await handler(body)

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

        console.info(`Executed ${registrar.type} '${name}'. Took ${Date.now() - start}ms to execute.`)
        return sendResult(res, {
          ...result,
          status: 200
        })
      } catch (err) {
        console.error(`An exception was thrown for ${registrar.type} '${name}': ${inspect(err, true, 10)}.`);
        return sendResult(res, {
          status: 500,
          errors: [
            `The server failed to process ${registrar.type} '${name}'. Try again later.`
          ]
        })
      }
    }
  }
}

export const withCommands = createCQExpressHandler(CommandHandler)
export const withQueries = createCQExpressHandler(QueryHandler)
