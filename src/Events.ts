import { v4 } from "uuid"
import { CQEvent } from "./Core"

type NameIfExtends<TEvent> = TEvent extends CQEvent<string> ? TEvent["name"]
  : ""
type WithoutBasicProps<TEvent> = Pick<TEvent, Exclude<keyof TEvent, keyof CQEvent<string>>>
export function createEvent<TEvent extends CQEvent<string>>(name: NameIfExtends<TEvent>, args: WithoutBasicProps<TEvent>) {

  return {
    id: v4(),
    when: new Date,
    name,

    ...args
  }
}
