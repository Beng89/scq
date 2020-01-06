// Event
export type CQEvent<TName extends string> = {
  id: string
  name: TName
  when: Date
}
export type CQEventHandler<TEvent extends CQEvent<string> = CQEvent<string>> = (event: TEvent) => void | Promise<void>

// Result
export type CQResult = {
  errors: string[]
  events: CQEvent<string>[]
}
export namespace CQResult {
  export function fromEvent(event: CQEvent<string>): CQResult {

    return {
      events: [event],
      errors: []
    }
  }
  export function fromEvents(events: CQEvent<string>[]): CQResult {

    return {
      events,
      errors: []
    }
  }

  export function fromError(error: string): CQResult {

    return {
      events: [],
      errors: [error]
    }
  }
  export function fromErrors(errors: string[]): CQResult {
    return {
      errors,
      events: []
    }
  }
}

// Handlers and Guards
export type CQHandler<TReq extends object = object> = (req: TReq) => Promise<CQResult> | CQResult
export type CQGuard<TReq extends object = object> = (req: TReq) => Promise<string[]> | string[]

// Event Store
export type EventQuery<TEvent extends CQEvent<string>> = {
  skip?: number
  take?: number

  properties: Partial<Record<keyof TEvent, any>>
}
export type EventStore = {
  append<TEvent extends CQEvent<string>>(event: TEvent): Promise<TEvent>
  append<TEvent extends CQEvent<string>>(event: TEvent[]): Promise<TEvent[]>

  query<TEvent extends CQEvent<string>>(query: EventQuery<TEvent>): Promise<TEvent[]>
}

// Pubsub
export type PubsubSubscription = {
  source: Pubsub

  unsubscribe(): void
}
export type Pubsub = {
  publish<TEvent extends CQEvent<string>>(event: TEvent): Promise<TEvent>
  publish<TEvent extends CQEvent<string>>(event: TEvent | TEvent[]): Promise<TEvent[]>
  subscribeTo<TEvent extends CQEvent<string>>(name: TEvent["name"], handler: CQEventHandler<TEvent>): PubsubSubscription
  subscribeToAll(handler: CQEventHandler): PubsubSubscription
}
