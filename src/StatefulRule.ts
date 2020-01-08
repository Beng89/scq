import { RuleResult, RuleTestResult, createRuleResult } from "./Rules";

// Stateful rule test...
export type StatefulRuleTest<TState, TInput> = (state: TState, input: TInput) => RuleTestResult

// Stateful rule...
export type StatefulRule<TState, TInput> = (state: TState, input: TInput) => RuleResult
export function createStatefulRule<TState, TInput = undefined>(message: string, test: StatefulRuleTest<TState, TInput>): StatefulRule<TState, TInput> {

  return (async (state: TState, input: TInput) => {
    const didPass = await test(state, input)

    return didPass === true ? createRuleResult()
      : createRuleResult(message)
  }) as StatefulRule<TState, TInput>
}

// Rule Chains...
export class StatefulRuleChain<TState, TInput = void> {

  private constructor(
    readonly rules: StatefulRule<TState, TInput>[] = []
  ) { }

  addRule(rule: StatefulRule<TState, TInput>): StatefulRuleChain<TState, TInput>
  addRule(message: string, test: StatefulRuleTest<TState, TInput>): StatefulRuleChain<TState, TInput>
  addRule(messageOrRule: string | StatefulRule<TState, TInput>, testOrUndefined?: StatefulRuleTest<TState, TInput>) {

    const rule = typeof messageOrRule === "function" ? messageOrRule
      : createStatefulRule<TState, TInput>(messageOrRule, testOrUndefined)

    return new StatefulRuleChain(this.rules.concat(rule))
  }

  public validate(state: TState, req: TInput) {
    return this.rules.reduce(async (errors, rule) => {
      const waitedErrors = await errors

      const result = await rule(state, req)

      return waitedErrors.concat(result)
    }, Promise.resolve(new Array<string>()))
  }

  static create<TState, TInput = void>() {
    return new StatefulRuleChain<TState, TInput>()
  }
}
