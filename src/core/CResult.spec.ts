import { CResult } from "./CResult"
import { expect } from "chai"
import { CError } from "./CError"
import { CEvent } from "./CEvent"

export function testCResult() {
  describe("CResult", () => {
    describe("#contsructor", () => {
      it("should default errors to an empty array when no errors are provided", () => {

        const result = new CResult()
        expect(result.errors)
          .to.be.an("array")
          .that.is.empty
      })
      it("should default events to an empty array when no events are provided", () => {

        const result = new CResult()
        expect(result.events)
          .to.be.an("array")
          .that.is.empty
      })
    })

    describe(".fromError", () => {
      it("should not contain events", () => {
        const error = new CError("Name1", "Message1")

        const result = CResult.fromError(error)
        expect(result.events)
          .to.be.an("array")
          .that.is.empty
      })
      it("should contain the error", () => {
        const error = new CError("Name1", "Message1")

        const result = CResult.fromError(error)
        expect(result.errors)
          .to.be.an("array")
          .that.contains(error)
      })
    })
    describe(".fromErrors", () => {
      it("should not contain events", () => {
        const error1 = new CError("Name1", "Message1")
        const error2 = new CError("Name2", "Message2")

        var result = CResult.fromErrors([error1, error2])
        expect(result.events)
          .to.be.an("array")
          .that.is.empty
      })
      it("should contain the errors", () => {
        const error1 = new CError("Name1", "Message1")
        const error2 = new CError("Name2", "Message2")

        var result = CResult.fromErrors([error1, error2])
        expect(result.errors)
          .to.be.an("array")
          .that.contains(error1)
          .and.that.contains(error2)
      })
    })
    describe(".fromEvent", () => {
      it("should contain the event", () => {
        const event: CEvent = {
          eventId: "1",
          eventName: "name1",
          eventOccurredAt: new Date(1)
        }

        var result = CResult.fromEvent(event)
        expect(result.events)
          .to.be.an("array")
          .that.contains(event)
      })
      it("should not contain any errors", () => {
        const event: CEvent = {
          eventId: "1",
          eventName: "name1",
          eventOccurredAt: new Date(1)
        }

        var result = CResult.fromEvent(event)
        expect(result.errors)
          .to.be.an("array")
          .that.is.empty
      })
    })
    describe(".fromEvents", () => {
      it("should contain the events", () => {
        const event1: CEvent = {
          eventId: "1",
          eventName: "name1",
          eventOccurredAt: new Date(1)
        }
        const event2: CEvent = {
          eventId: "2",
          eventName: "name2",
          eventOccurredAt: new Date(2)
        }

        var result = CResult.fromEvents([event1, event2])
        expect(result.events)
          .to.be.an("array")
          .that.contains(event1)
          .and.contains(event2)
      })
      it("should not contain any errors", () => {
        const event1: CEvent = {
          eventId: "1",
          eventName: "name1",
          eventOccurredAt: new Date(1)
        }
        const event2: CEvent = {
          eventId: "2",
          eventName: "name2",
          eventOccurredAt: new Date(2)
        }

        var result = CResult.fromEvents([event1, event2])
        expect(result.errors)
          .to.be.an("array")
          .that.is.empty
      })
    })
  })
}
