import { CQEvent, EventQuery } from "."

export type EventQueryBuilder<TEvent extends CQEvent<string>> = Readonly<{
  setSkip(skip: number, setIfUndefined?: true): EventQueryBuilder<TEvent>
  setTake(take: number, setIfUndefined?: true): EventQueryBuilder<TEvent>
  setProperty<TKey extends keyof TEvent>(key: TKey, value: TEvent[TKey], setIfUndefined?: true): EventQueryBuilder<TEvent>
  setProperty<TKey extends keyof TEvent>(key: TKey, value: any, setIfUndefined?: true): EventQueryBuilder<TEvent>

  build(): EventQuery<TEvent>
}>
export function createEventQueryBuilder<TEvent extends CQEvent<string>>() {

  function factory(query: EventQuery<TEvent>): EventQueryBuilder<TEvent> {

    return {
      setSkip(skip, setIfUndefined) {
        if (typeof skip !== "undefined" || setIfUndefined === true) {
          return factory({
            ...query,
            skip
          })
        }

        return factory(query)
      },
      setTake(take, setIfUndefined) {
        if (typeof take !== "undefined" || setIfUndefined === true) {
          return factory({
            ...query,
            take
          })
        }

        return factory(query)


      },
      setProperty(key, value, setIfUndefined) {
        if ((typeof key !== "undefined" && typeof value != "undefined") || setIfUndefined === true) {
          return factory({
            ...query,
            properties: {
              ...query.properties,
              [key]: value
            }
          })
        }

        return factory(query)
      },
      build() {

        return query
      }
    }
  }

  return factory({ properties: {} })
}
