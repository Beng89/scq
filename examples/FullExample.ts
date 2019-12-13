import { CModel, CEvent, CError, CResult, ValidationChain } from "scq"

// An error w/ a rule
class InvalidName extends CError {

  constructor() {
    super(InvalidName.name, "A valid name must be a string that is more than 4 characters in length.")
  }

  static test(name: string) {
    return (
      typeof name !== "string"
      || name.length < 4
    )
  }
}

// An event that can occur
interface NameChanged extends CEvent<"NameChanged"> {
  readonly newName: string

  readonly changedBy: string
}

// A model
class WithName extends CModel {
  name: string

  apply(event: CEvent) {
    switch (event.eventName) {

      case "NameChanged":
        const changed = event as NameChanged
        this.name = changed.newName

        return event

      default:
        return event
    }
  }
}

// A subject
class Subject {
  id: string

  rename(model: WithName, newName: string, when: Date): CResult {
    const errors = ValidationChain.validate(
      ValidationChain.createRuleFromCtor(InvalidName, () => InvalidName.test(newName))
    )

    return errors.length > 0 ? CResult.fromErrors(errors)
      : CResult.fromEvent(model.apply({
        eventId: "event1",
        eventName: "NameChanged",
        eventOccurredAt: when,

        changedBy: this.id,
        newName
      } as NameChanged))
  }
}

export function renameModel(actor: Subject, model: WithName, newName: string, when: Date) {

  const result = actor.rename(model, newName, when)

  if (result.errors.length > 0) {
    console.info("Failed to rename model:", result.errors)
  } else {
    console.info(`Successfully renamed model to ${model.name}.`)
  }

  return result
}