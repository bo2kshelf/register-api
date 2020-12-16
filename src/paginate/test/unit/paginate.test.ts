import * as Relay from 'graphql-relay';
import {getMeta, getPagingParameters} from '../../paginate';

jest.mock('graphql-relay');

describe('paginate', () => {
  describe('getMeta()', () => {
    it('forward', () => {
      expect(getMeta({first: 20})).toStrictEqual({
        pagingType: 'forward',
        first: 20,
        after: undefined,
      });
      expect(getMeta({after: 'after'})).toStrictEqual({
        pagingType: 'forward',
        first: 0,
        after: 'after',
      });
      expect(getMeta({first: 20, after: 'after'})).toStrictEqual({
        pagingType: 'forward',
        first: 20,
        after: 'after',
      });
    });
    it('backward', () => {
      expect(getMeta({last: 20})).toStrictEqual({
        pagingType: 'backward',
        last: 20,
        before: undefined,
      });
      expect(getMeta({before: 'before'})).toStrictEqual({
        pagingType: 'backward',
        last: 0,
        before: 'before',
      });
      expect(getMeta({last: 20, before: 'before'})).toStrictEqual({
        pagingType: 'backward',
        last: 20,
        before: 'before',
      });
    });
    it('none', () => {
      expect(getMeta({})).toStrictEqual({pagingType: 'none'});
    });
    it('backwardとforwardではforwardを優先', () => {
      expect(
        getMeta({
          first: 20,
          last: 20,
          after: 'after',
          before: 'before',
        }),
      ).toStrictEqual({
        pagingType: 'forward',
        first: 20,
        after: 'after',
      });
    });
  });

  describe('getPagingParameters()', () => {
    beforeAll(() => {
      jest.clearAllMocks();
    });

    it('after無しのforwardの場合', () => {
      expect(
        getPagingParameters({
          pagingType: 'forward',
          first: 20,
          after: undefined,
        }),
      ).toStrictEqual({
        limit: 20,
        offset: 0,
      });
    });
    it('afterがあるforwardの場合', () => {
      jest.spyOn(Relay, 'cursorToOffset').mockReturnValueOnce(10);
      expect(
        getPagingParameters({
          pagingType: 'forward',
          first: 20,
          after: '10',
        }),
      ).toStrictEqual({
        limit: 20,
        offset: 11,
      });
    });

    it('backwardの場合(before < last)', () => {
      jest.spyOn(Relay, 'cursorToOffset').mockReturnValueOnce(15);
      expect(
        getPagingParameters({
          pagingType: 'backward',
          last: 20,
          before: '15',
        }),
      ).toStrictEqual({
        limit: 15,
        offset: 0,
      });
    });

    it('backwardの場合(before >= last)', () => {
      jest.spyOn(Relay, 'cursorToOffset').mockReturnValueOnce(30);
      expect(
        getPagingParameters({
          pagingType: 'backward',
          last: 20,
          before: '30',
        }),
      ).toStrictEqual({
        limit: 20,
        offset: 10,
      });
    });

    it('none', () => {
      expect(getPagingParameters({pagingType: 'none'})).toStrictEqual({});
    });
  });
});
