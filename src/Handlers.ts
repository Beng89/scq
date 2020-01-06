import { createRegistrar } from "./HandlerRegistrar";
import { CQHandler, CQEventHandler } from "./Core";

export const CommandHandler = createRegistrar<CQHandler>("command")
export const EventHandler = createRegistrar<CQEventHandler>("event")
export const QueryHandler = createRegistrar<CQHandler>("query")
