import { CModel } from "./CModel"
import { CEvent } from "./CEvent"
import { expect } from "chai"

export function testCModel() {
  describe("CModel", () => {
    interface NameChanged extends CEvent<"NameChanged"> {
      readonly newName: string
    }

    class WithName extends CModel {
      name: string

      apply(event: NameChanged) {
        switch (event.eventName) {

          case "NameChanged":
            this.name = event.newName
            return event

          default:
            return event
        }
      }
    }

    describe("#constructor", () => {
      it("should not fail when events are not provided", () => {

        expect(() => {
          new WithName()
        }).to.not.throw
      })
      it("should apply events when they are provided", () => {
        const nameChanged: NameChanged = {
          eventId: "1",
          eventName: "NameChanged",
          eventOccurredAt: new Date(1),
          newName: "name1"
        }

        const withName = new WithName([nameChanged])
        expect(withName.name)
          .to.equal(nameChanged.newName)
      })
    })

    describe("#applyMany", () => {
      it("should return the events", () => {
        const nameChanged1: NameChanged = {
          eventId: "1",
          eventName: "NameChanged",
          eventOccurredAt: new Date(1),
          newName: "name1"
        }
        const nameChanged2: NameChanged = {
          eventId: "2",
          eventName: "NameChanged",
          eventOccurredAt: new Date(2),
          newName: "name2"
        }

        const withName = new WithName()
        const applied = withName.applyMany([nameChanged1, nameChanged2])

        expect(applied)
          .to.be.an("array")
          .that.contains(nameChanged1)
          .and.that.contains(nameChanged2)
      })
      it("should apply events", () => {
        const nameChanged1: NameChanged = {
          eventId: "1",
          eventName: "NameChanged",
          eventOccurredAt: new Date(1),
          newName: "name1"
        }
        const nameChanged2: NameChanged = {
          eventId: "2",
          eventName: "NameChanged",
          eventOccurredAt: new Date(2),
          newName: "name2"
        }

        const withName = new WithName()
        withName.applyMany([nameChanged1, nameChanged2])

        expect(withName.name)
          .to.equal(nameChanged2.newName)
      })
    })
  })
}