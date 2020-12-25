import {Test, TestingModule} from '@nestjs/testing';
import * as Relay from 'graphql-relay';
import {PaginateService} from '../../paginate.service';

jest.mock('graphql-relay');

describe('PaginateService', () => {
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
      expect(
        paginateService.getPagingParameters({
          first: 20,
          after: undefined,
        }),
      ).toStrictEqual({
        limit: 20,
        skip: 0,
      });
    });
    it('afterがあるforwardの場合', () => {
      jest.spyOn(Relay, 'cursorToOffset').mockReturnValueOnce(10);
      expect(
        paginateService.getPagingParameters({
          first: 20,
          after: '10',
        }),
      ).toStrictEqual({
        limit: 20,
        skip: 11,
      });
    });

    it('backwardの場合(before < last)', () => {
      jest.spyOn(Relay, 'cursorToOffset').mockReturnValueOnce(15);
      expect(
        paginateService.getPagingParameters({
          last: 20,
          before: '15',
        }),
      ).toStrictEqual({
        limit: 15,
        skip: 0,
      });
    });

    it('backwardの場合(before >= last)', () => {
      jest.spyOn(Relay, 'cursorToOffset').mockReturnValueOnce(30);
      expect(
        paginateService.getPagingParameters({
          last: 20,
          before: '30',
        }),
      ).toStrictEqual({
        limit: 20,
        skip: 10,
      });
    });

    it('none', () => {
      expect(paginateService.getPagingParameters({})).toStrictEqual({});
    });
  });
});
