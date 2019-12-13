import { expect } from "chai"
import { CError } from "./CError"

export function testCError() {
  describe("CError", () => {
    describe(".fromError", () => {
      it("should copy the name and message", () => {
        const error = new Error()
        error.name = "NAME"
        error.message = "MESSAGE"

        const cError = CError.fromError(error)
        expect(cError.name).to.equal(error.name)
        expect(cError.message).to.equal(error.message)
      })
    })
  })
}
