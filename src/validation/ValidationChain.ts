import { CError } from "../core/CError"

export class ValidationChain {

  static createRuleFromCtor(Ctor: { new(): CError }, test: () => boolean): ReturnType<typeof ValidationChain["createRule"]> {
    return ValidationChain.createRule(() => new Ctor(), test);
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
