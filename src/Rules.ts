export class Rule<TInput = void> {

  constructor(
    readonly satisfied: (req: TInput) => Promise<boolean> | boolean,
    readonly getError: () => string
  ) { }
}

export class RuleChain<TInput = void> {

  private constructor(
    readonly rules: Rule<TInput>[] = []
  ) { }

  public addRule(message: string, satisfied: (req: TInput) => Promise<boolean> | boolean) {
    return new RuleChain([
      ...this.rules,
      new Rule(satisfied, () => message)
    ])
  }

  public validate(req: TInput) {
    return this.rules.reduce(async (errors, rule) => {
      const waitedErrors = await errors

      const satisfied = await rule.satisfied(req)

      return satisfied ? waitedErrors
        : waitedErrors.concat(rule.getError())
    }, Promise.resolve(new Array<string>()))
  }

  static create<TInput = void>() {
    return new RuleChain<TInput>()
  }
}
