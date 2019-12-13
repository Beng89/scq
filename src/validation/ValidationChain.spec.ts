import { CError } from "../core/CError"
import { ValidationChain } from "./ValidationChain"
import { expect } from "chai"

export function testValidationChain() {
  describe("ValidationChain", () => {

    class SimpleError extends CError {

      constructor() {
        super(SimpleError.name, "message")
      }
    }

    describe(".createRuleFromCtor", () => {
      it("should provide a make error function that creats the specified error", () => {

        const rule = ValidationChain.createRuleFromCtor(SimpleError, () => true)

        var error = rule.makeError()
        expect(error)
          .to.be.instanceOf(SimpleError)
      })
    })
    describe(".createRule", () => {
      it("should return the rule", () => {

        const rule = ValidationChain.createRule(() => new SimpleError(), () => true)

        expect(rule).to.exist
      })
    })

    describe(".validate", () => {
      it("should not return errors when none of the rules are broken", () => {
        const rule1 = ValidationChain.createRuleFromCtor(SimpleError, () => false)
        const rule2 = ValidationChain.createRuleFromCtor(SimpleError, () => false)

        const errors = ValidationChain.validate([rule1, rule2])
        expect(errors)
          .to.be.an("array")
          .that.is.empty
      })
      it("should return the errors for the rules that were broken", () => {
        const rule1 = ValidationChain.createRuleFromCtor(SimpleError, () => true)
        const rule2 = ValidationChain.createRuleFromCtor(SimpleError, () => true)

        const errors = ValidationChain.validate([rule1, rule2])
        expect(errors)
          .to.be.an("array")
          .that.has.length(2)
      })
    })
  })
}
