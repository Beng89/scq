// Rule Tests...
export type RuleTestResult = boolean | Promise<boolean>
export type RuleTest<TInput> = (input: TInput) => RuleTestResult

// Rules...
export type RuleResult = string[] | [] | Promise<string[] | []>
export function createRuleResult(messageOrMessages?: string | string[]): RuleResult {
  return typeof messageOrMessages === "string" ? [messageOrMessages]
    : Array.isArray(messageOrMessages) ? messageOrMessages
      : []
}
export type Rule<TInput> = (input: TInput) => RuleResult;
export function createRule<TInput = undefined>(message: string, test: RuleTest<TInput>): Rule<TInput> {

  return (async (input: TInput) => {
    const didPass = await test(input)

    return didPass === true ? createRuleResult()
      : createRuleResult(message)
  }) as Rule<TInput>
}

// Rule Chains...
export class RuleChain<TInput = void> {

  private constructor(
    readonly rules: Rule<TInput>[] = []
  ) { }

  addRule(rule: Rule<TInput>): RuleChain<TInput>
  addRule(message: string, test: RuleTest<TInput>): RuleChain<TInput>
  addRule(messageOrRule: string | Rule<TInput>, testOrUndefined?: RuleTest<TInput>) {

    const rule = typeof messageOrRule === "function" ? messageOrRule
      : createRule<TInput>(messageOrRule, testOrUndefined)

    return new RuleChain(this.rules.concat(rule))
  }

  public validate(req: TInput) {
    return this.rules.reduce(async (errors, rule) => {
      const waitedErrors = await errors

      const result = await rule(req)

      return waitedErrors.concat(result)
    }, Promise.resolve(new Array<string>()))
  }

  static create<TInput = void>() {
    return new RuleChain<TInput>()
  }
}
