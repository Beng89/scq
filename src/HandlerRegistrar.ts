import { CQGuard } from "."
import { CQHandler, CQEventHandler, CQResult, GetState, GetEvents, CQEvent, Reducer } from "./Core"
import { RuleChain, RuleTest, Rule } from "./Rules"
import { StatefulRuleChain, StatefulRule } from "./StatefulRule"

type NameOrString<TMaybeName> = TMaybeName extends { name: infer TName } ? TName
  : string
type Request<THandler> = THandler extends CQHandler<infer TRequest> ? TRequest
  : THandler extends CQEventHandler<infer TEvent> ? TEvent
  : never
type Response<THandler> = THandler extends CQHandler ? ReturnType<THandler>
  : THandler extends CQEventHandler ? ReturnType<THandler>
  : never

type SmartHandler<THandler> = (req: Request<THandler>) => Response<THandler>
type TestState<TInput> = (input: TInput) => Promise<string[]>

type SetGuard = (name: string, guard: CQGuard<any>) => void
type AddRule = (name: string, rule: Rule<any>) => void
type SetTestState = (name: string, stateType: string, test: TestState<any>) => void

function createNameTypeKey(name: string, type: string) {
  if (name?.includes(":")) {
    throw new Error(`name ${name} includes an illegal character ':'.`)
  } else if (type?.includes(":")) {
    throw new Error(`stateType ${type} includes an illegal character ':'.`)
  }

  return `${name}:${type}`
}
function createPartialNameTypeKey(name: string) {
  if (name?.includes(":")) {
    return false
  }

  return `${name?.toLowerCase()}:`
}

export type Registrar<THandler extends Function> = Register<THandler> & Readonly<{
  type: string

  findHandler(name: string): SmartHandler<THandler> | undefined
  findGuard(name: string): CQGuard<any> | undefined
  findRules(name: string): RuleChain<Request<THandler>> | undefined
  findStateTestsByName(name: string): TestState<any>[]

  dispatch(name: string, req: Request<THandler>): Promise<CQResult>
}>
export function createRegistrar<THandler extends (CQHandler | CQEventHandler)>(type: string): Registrar<THandler> {

  const handlersByName = new Map<string, SmartHandler<THandler>>()
  const rulesByName = new Map<string, RuleChain<any>>()
  const stateTestsByKey = new Map<string, TestState<any>>()
  const guardsByName = new Map<string, CQGuard<any>>()

  const setHandler = (name: string, handler: SmartHandler<THandler>) => {
    name = name.toLowerCase()

    handlersByName.set(name, handler)
  }
  const setGuard: SetGuard = (name, guard) => {
    name = name.toLowerCase()

    guardsByName.set(name, guard)
  }
  const addRule: AddRule = (name, rule) => {
    name = name.toLowerCase()

    const rules = rulesByName.get(name) ?? RuleChain.create<any>()

    rulesByName.set(name, rules.addRule(rule))
  }
  const setTestState: SetTestState = (name, type, rule) => {
    name = name.toLowerCase()
    type = type.toLowerCase()

    const key = createNameTypeKey(name, type)

    stateTestsByKey.set(key, rule)
  }

  const registrar = Object.assign(function registrar<TInput extends Request<THandler>>(name: NameOrString<TInput>, handler: (req: TInput) => Response<THandler>) {
    if (typeof handler !== "function") {
      throw new Error("handler must be a function")
    } else if (typeof name !== "string" || name.length === 0) {
      throw new Error("name must be a non-empty string")
    }

    // case-insensitive lookups
    setHandler(name, handler)
    console.info(`registered ${type} '${name.toLowerCase()}'.`)

    return createRegistered(name, setGuard, addRule, setTestState)
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
    findStateTestsByName(name: string) {

      const keyOrFalse = createPartialNameTypeKey(name)
      if (keyOrFalse !== false) {
        return Array.from(stateTestsByKey)
          .filter(([key]) => key.startsWith(keyOrFalse))
          .map(([_, test]) => test)
      }

      return []
    },

    async dispatch<TReq extends Request<THandler>>(name: string, req: TReq) {

      const rules = registrar.findRules(name) ?? RuleChain.create<any>()
      const guard = registrar.findGuard(name) ?? (() => new Array<string>())
      const handler = registrar.findHandler(name) ?? false
      const stateTests = registrar.findStateTestsByName(name)
      if (handler === false) {
        return CQResult.fromError(`A handler for the ${type} '${name}' does not exist`)
      }


      const errors = [
        ...(await rules.validate(req)),
        ...(await guard(req)),
        ...(await stateTests.reduce(
          async (errors, test) => {
            const waitedErrors = await errors

            const results = await test(req)

            return waitedErrors.concat(results)
          }, Promise.resolve(new Array<string>())))
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
export type Registered<TReq> = {
  withGuard(guard: CQGuard<TReq>): Registered<TReq>
  withRule(rule: Rule<TReq>): Registered<TReq>

  withState<TState>(stateType: string, getCustomState: GetState<TState, TReq>): RegisteredWithState<TState, TReq>
  withReducedState<TState, TEvent extends CQEvent<string>>(stateType: string, reduce: Reducer<TState, TEvent>, getEvents: GetEvents<TReq, TEvent>): RegisteredWithState<TState, TReq>
}
function createRegistered<TInput>(name: string, setGuard: SetGuard, addRule: AddRule, setStateTest: SetTestState): Registered<TInput> {

  return {
    withGuard(this: Registered<TInput>, guard) {
      if (typeof guard !== "function") {
        throw new Error("test must be a function")
      }

      setGuard(name, guard)

      return this
    },
    withRule(this: Registered<TInput>, rule) {

      addRule(name, rule)

      return this
    },

    withState<TState>(stateType: string, getState: GetState<TState, TInput>) {
      if (stateType?.includes(":")) {
        throw new Error("stateType may not include ':' characters")
      }

      return createRegisteredWithState<TState, TInput>(name, stateType, getState, this, setStateTest)
    },
    withReducedState<TState, TEvent extends CQEvent<string>>(stateType: string, reduce: Reducer<TState, TEvent>, getEvents: GetEvents<TInput, TEvent>) {
      if (stateType?.includes(":")) {
        throw new Error("stateType may not include ':' characters")
      }

      const getState: GetState<TState, TInput> = async input => {

        const events = await Promise.resolve(getEvents(input))
          // swallow error and return empty array
          .catch(() => new Array<TEvent>())

        return events.reduce(
          (state, event) => reduce(state, event), null as TState);
      }

      return createRegisteredWithState<TState, TInput>(name, stateType, getState, this, setStateTest)
    }
  }
}

export type RegisteredWithState<TState, TReq> = {
  withRule(rule: StatefulRule<TState, TReq>): RegisteredWithState<TState, TReq>

  endState(): Registered<TReq>
}
function createRegisteredWithState<TState, TReq>(name: string, stateType: string, getState: GetState<TState, TReq>, registered: Registered<TReq>, setStateTest: SetTestState): RegisteredWithState<TState, TReq> {

  let rules = StatefulRuleChain.create<TState, TReq>()

  setStateTest(name, stateType, async input => {

    const state = await Promise.resolve(getState(input))
      // swallow the error and return a null state
      .catch(() => null as TState)

    return rules.validate(state, input)
  })

  return {
    withRule(this: RegisteredWithState<TState, TReq>, rule) {

      rules = rules.addRule(rule)

      return this
    },

    endState() {
      return registered
    }
  }
}
