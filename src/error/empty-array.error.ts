export class EmptyArrayError extends Error {
  constructor(value: string) {
    super(`Cannot be empty ${value}`);
    this.name = 'EmptyArrayError';
  }
}
