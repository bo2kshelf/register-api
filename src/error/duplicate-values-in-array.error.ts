export class DuplicateValueInArrayError extends Error {
  constructor(value: string) {
    super(`Find duplicate in ${value}`);
    this.name = 'DuplicateValueInArrayError';
  }
}
