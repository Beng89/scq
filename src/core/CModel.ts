import { CEvent } from "./CEvent"

export abstract class CModel {

  constructor()
  constructor(events: ReadonlyArray<CEvent>)
  constructor(events = []) {
    this.applyMany(events)
  }

  applyMany(events: ReadonlyArray<CEvent>): ReadonlyArray<CEvent> {
    return events.reduce(
      (events, event) => events.concat(this.apply(event)),
      new Array<CEvent>()
    )
  }

  abstract apply(event: CEvent): CEvent
}
