import {Test, TestingModule} from '@nestjs/testing';
import * as Relay from 'graphql-relay';
import {PaginateService} from '../../paginate.service';

jest.mock('graphql-relay');

describe(PaginateService.name, () => {
  let module: TestingModule;

  let paginateService: PaginateService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [PaginateService],
    }).compile();

    paginateService = module.get<PaginateService>(PaginateService);
  });

  describe('getPagingParameters()', () => {
    beforeAll(() => {
      jest.clearAllMocks();
    });

    it('after無しのforwardの場合', () => {
      const actual = paginateService.getPagingParameters({
        first: 20,
        after: undefined,
      });
      const expected = {limit: 20, skip: 0};
      expect(actual).toStrictEqual(expected);
    });
    it('afterがあるforwardの場合', () => {
      jest.spyOn(Relay, 'cursorToOffset').mockReturnValueOnce(10);

      const actual = paginateService.getPagingParameters({
        first: 20,
        after: '10',
      });
      const expected = {
        limit: 20,
        skip: 11,
      };
      expect(actual).toStrictEqual(expected);
    });

    it('backwardの場合(before < last)', () => {
      jest.spyOn(Relay, 'cursorToOffset').mockReturnValueOnce(15);
      const actual = paginateService.getPagingParameters({
        last: 20,
        before: '15',
      });
      const expected = {
        limit: 15,
        skip: 0,
      };
      expect(actual).toStrictEqual(expected);
    });

    it('backwardの場合(before >= last)', () => {
      jest.spyOn(Relay, 'cursorToOffset').mockReturnValueOnce(30);
      const actual = paginateService.getPagingParameters({
        last: 20,
        before: '30',
      });
      const expected = {
        limit: 20,
        skip: 10,
      };
      expect(actual).toStrictEqual(expected);
    });

    it('none', () => {
      const actual = paginateService.getPagingParameters({});
      const expected = {};
      expect(actual).toStrictEqual(expected);
    });
  });
});
