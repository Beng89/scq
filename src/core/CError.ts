export class CError {
  constructor(
    readonly name: string,
    readonly message: string
  ) { }

  static fromError(error: Error) {

    return new CError(
      error.name,
      error.message
    )
  }
}
