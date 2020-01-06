import { readdirSync } from "fs"
import { join } from "path"

export const loadHandlers = ({ directory = "" }) => {
  const files = readdirSync(directory)

  files.forEach(file => require(join(directory, file)))
}
