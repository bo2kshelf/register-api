import {EmptyArrayError} from '../error/empty-array.error';

export function checkIfNotArrayEmpty(array: any[], name: string) {
  if (array.length === 0) throw new EmptyArrayError(name);
}
