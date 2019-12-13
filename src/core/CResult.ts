import { CError } from "./CError"
import { CEvent } from "./CEvent"

export class CResult {

  constructor(
    readonly errors: ReadonlyArray<CError> = [],
    readonly events: ReadonlyArray<CEvent> = []
  ) { }

  static fromError<TError extends CError = CError(error: Error) {
    return new CResult([error], [])
  }
  static fromErrors(errors: ReadonlyArray<Error>) {
    return new CResult(errors, [])
  }

  static fromEvent<TEvent extends CEvent = CEvent>(event: TEvent) {
    return new CResult([], [event])
  }
  static fromEvents(events: ReadonlyArray<CEvent>) {
    return new CResult([], events)
  }
}
