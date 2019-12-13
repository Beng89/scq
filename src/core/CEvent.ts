export interface CEvent<TName extends string = string> {
  readonly eventId: string,
  readonly eventName: TName,
  readonly eventOccurredAt: Date
}
