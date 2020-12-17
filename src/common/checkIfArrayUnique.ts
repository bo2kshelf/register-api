import {DuplicateValueInArrayError} from '../error/duplicate-values-in-array.error';
import {isArrayUnique} from '../util';

export function checkIfArrayUnique(array: any[], name: string) {
  if (!isArrayUnique(array)) throw new DuplicateValueInArrayError(name);
}
