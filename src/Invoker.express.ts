import { Response, RequestHandler } from "express"
import { inspect } from "util"
import { Registrar, CQHandler } from "."
import { CommandHandler, QueryHandler } from "./Handlers"
import { createLocalInvoker, LocalInvokerOptions } from "./Invoker.local"

const sendResult = (res: Response, { events = new Array<object>(), errors = new Array<string>(), status = 200 }) => {
  res.status(status).json({
    errors,
    events
  })
}

export type ExpressInvokerOptions = LocalInvokerOptions & {
  paramName: string
}
export function createExpressInvoker(registrar: Registrar<CQHandler>): (options: ExpressInvokerOptions) => RequestHandler {

  return options => {

    const invoker = createLocalInvoker(registrar)(options)
    const { paramName } = options

    return async (req, res) => {

      const { [paramName]: name } = req.params
      const { body } = req

      try {

        const result = await invoker(name, body)

        const status = result.errors.length === 0 ? 200
          : 400

        return sendResult(res, {
          status,
          ...result
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

export const withCommands = createExpressInvoker(CommandHandler)
export const withQueries = createExpressInvoker(QueryHandler)
