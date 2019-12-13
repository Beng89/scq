import { CError } from "../core/CError"

export class ValidationChain {

  static createRuleFromCtor(Ctor: { new(): CError }, test: () => boolean): ReturnType<typeof ValidationChain["createRule"]> {
    return {
      test,
      makeError: () => new Ctor()
    }
  }
  static createRule(makeError: () => CError, test: () => boolean) {
    return {
      test,
      makeError
    }
  }

  static validate(...rules: ReadonlyArray<ReturnType<typeof ValidationChain["createRule"]>>): ReadonlyArray<CError> {
    return rules.reduce((errors, rule) => rule.test() ? errors.concat(rule.makeError())
      : errors, [])
  }
}
