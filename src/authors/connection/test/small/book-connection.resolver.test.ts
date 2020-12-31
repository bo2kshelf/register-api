import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {NoDocumentForObjectIdError} from '../../../../error/no-document-for-objectid.error';
import {AuthorsService} from '../../../authors.service';
import {Author} from '../../../schema/author.schema';
import {BookAuthorsConnection} from '../../book-connection.entity';
import {BookAuthorsConnectionResolver} from '../../book-connection.resolver';

jest.mock('../../../authors.service');

describe(BookAuthorsConnectionResolver.name, () => {
  let module: TestingModule;

  let authorsService: AuthorsService;
  let connectionResolver: BookAuthorsConnectionResolver;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [AuthorsService, BookAuthorsConnectionResolver],
    }).compile();

    authorsService = module.get<AuthorsService>(AuthorsService);
    connectionResolver = module.get<BookAuthorsConnectionResolver>(
      BookAuthorsConnectionResolver,
    );
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(connectionResolver).toBeDefined();
  });

  describe('author()', () => {
    it('Serviceから正常に取得できたらそれを返す', async () => {
      jest.spyOn(authorsService, 'getById').mockResolvedValueOnce({} as Author);

      const actual = await connectionResolver.author({
        id: new ObjectId(),
      } as BookAuthorsConnection);
      expect(actual).toBeDefined();
    });

    it('Serviceから例外が投げられたらそのまま投げる', async () => {
      const id = new ObjectId();

      jest
        .spyOn(authorsService, 'getById')
        .mockRejectedValueOnce(new NoDocumentForObjectIdError(Author.name, id));

      await expect(() =>
        connectionResolver.author({
          id: new ObjectId(),
        } as BookAuthorsConnection),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });
  });
});
