import { readdirSync } from "fs"
import { join } from "path"

type Options = {
  directory: string

  filter?: (file: string) => boolean
}
export const loadHandlers = (options: Options) => {
  let { directory, filter } = options

  filter = typeof filter === "function" ? filter
    : () => true

  const files = readdirSync(directory)
    .filter(filter)

  files.forEach(file => require(join(directory, file)))
}
