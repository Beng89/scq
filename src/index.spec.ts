import "mocha"
import { testCError } from "./core/CError.spec"
import { testCResult } from "./core/CResult.spec"
import { testCModel } from "./core/CModel.spec"
import { testValidationChain } from "./validation/ValidationChain.spec"

function testCore() {
  describe("core", () => {
    testCError()
    testCResult()
    testCModel()
  })
}
function testValidation() {
  describe("validation", () => {
    testValidationChain()
  })
}

function testAll() {
  testCore()
  testValidation()
}

testAll()
