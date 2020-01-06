import { CQGuard } from "."
import { CQHandler, CQEventHandler, CQResult } from "./Core"
import { RuleChain } from "./Rules"

type NameOrString<TMaybeName> = TMaybeName extends { name: infer TName } ? TName
  : string
type Request<THandler> = THandler extends CQHandler<infer TRequest> ? TRequest
  : THandler extends CQEventHandler<infer TEvent> ? TEvent
  : never
type Response<THandler> = THandler extends CQHandler ? ReturnType<THandler>
  : THandler extends CQEventHandler ? ReturnType<THandler>
  : never

type SmartHandler<THandler> = (req: Request<THandler>) => Response<THandler>

export function createRegistrar<THandler extends (CQHandler | CQEventHandler)>(type: string): Registrar<THandler> {

  const handlersByName = new Map<string, (req: Request<THandler>) => Response<THandler>>()
  const rulesByName = new Map<string, RuleChain<any>>();
  const guardsByName = new Map<string, CQGuard>()

  const registrar = Object.assign(function registrar<TReq extends Request<THandler>>(name: NameOrString<TReq>, handler: (req: TReq) => Response<THandler>) {
    if (typeof handler !== "function") {
      throw new Error("handler must be a function")
    } else if (typeof name !== "string" || name.length === 0) {
      throw new Error("name must be a non-empty string")
    }

    // case-insensitive lookups
    const lowerName = name.toLowerCase()

    handlersByName.set(lowerName, handler)
    console.info(`registered ${type} '${lowerName}'.`)

    return {
      withGuard(guard: CQGuard<TReq>) {
        if (typeof guard !== "function") {
          throw new Error("test must be a function")
        }

        guardsByName.set(lowerName, guard)

        return this
      },
      withRules(rulesOrFactory: RuleChain<TReq> | ((rules: RuleChain<TReq>) => RuleChain<TReq>)) {

        let rules = rulesByName.get(lowerName) ?? RuleChain.create<TReq>()

        const factory = typeof rulesOrFactory === "function" ? rulesOrFactory
          : () => rulesOrFactory

        rules = factory(rules)

        rulesByName.set(lowerName, rules)

        return this
      }
    }
  }, {
    type,

    findRules(name: string) {
      // case-insensitive lookups
      name = name.toLowerCase()

      return rulesByName.get(name)
    },

    findHandler(name: string) {
      // case-insensitive lookups
      name = name.toLowerCase()

      return handlersByName.get(name)
    },
    findGuard(name: string) {
      // case-insensitive lookups
      name = name.toLowerCase()

      return guardsByName.get(name)
    },

    async dispatch<TReq extends Request<THandler>>(name: string, req: TReq) {

      const rules = registrar.findRules(name) ?? RuleChain.create<any>()
      const guard = registrar.findGuard(name) ?? (() => new Array<string>())
      const handler = registrar.findHandler(name) ?? false
      if (handler === false) {
        return CQResult.fromError(`A handler for the ${type} '${name}' does not exist`)
      }

      const errors = [
        ...(await rules.validate(req)),
        ...(await guard(req))
      ]
      if (Array.isArray(errors) && errors.length > 0) {
        return CQResult.fromErrors(errors)
      }

      const result = await handler(req)

      return result ?? CQResult.fromEvents([])
    }
  })

  return registrar as Registrar<THandler>
}

export type Register<THandler extends Function> = <TReq extends Request<THandler>>(name: NameOrString<TReq>, handler: (req: TReq) => Response<THandler>) => Registered<TReq>
export type Registered<TReq extends object> = {
  withGuard(guard: CQGuard<TReq>): Registered<TReq>
  withRules(rules: RuleChain<TReq>): Registered<TReq>
  withRules(createRules: (rules: RuleChain<TReq>) => RuleChain<TReq>): Registered<TReq>
}
export type Registrar<THandler extends Function> = Register<THandler> & Readonly<{
  type: string

  findHandler(name: string): SmartHandler<THandler> | undefined
  findGuard(name: string): CQGuard | undefined
  findRules(name: string): RuleChain<Request<THandler>> | undefined

  dispatch<TReq extends Request<THandler>>(name: string, req: TReq): Promise<CQResult>
}>
