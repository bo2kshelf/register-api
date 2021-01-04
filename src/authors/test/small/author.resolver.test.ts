import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {BookDocument} from '../../../books/schema/book.schema';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {RelayConnection} from '../../../paginate/paginate.service';
import {AuthorsResolver} from '../../authors.resolver';
import {AuthorsService} from '../../authors.service';
import {AuthorBooksArgs} from '../../dto/books.args';
import {CreateAuthorInput} from '../../dto/create-author.input';
import {AuthorDocument} from '../../schema/author.schema';

jest.mock('../../authors.service');

describe(AuthorsResolver.name, () => {
  let module: TestingModule;

  let authorsResolver: AuthorsResolver;
  let authorsService: AuthorsService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [AuthorsService, AuthorsResolver],
    }).compile();

    authorsService = module.get<AuthorsService>(AuthorsService);

    authorsResolver = module.get<AuthorsResolver>(AuthorsResolver);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(authorsResolver).toBeDefined();
  });

  describe('author()', () => {
    it('Serviceから正常に取得できたらそれを返す', async () => {
      jest
        .spyOn(authorsService, 'getById')
        .mockResolvedValueOnce({} as AuthorDocument);

      const actual = await authorsResolver.author(new ObjectId().toHexString());
      expect(actual).toBeDefined();
    });

    it('Serviceから例外が投げられたらそのまま投げる', async () => {
      const id = new ObjectId();

      jest
        .spyOn(authorsService, 'getById')
        .mockRejectedValueOnce(
          new NoDocumentForObjectIdError(BookDocument.name, id),
        );

      await expect(() =>
        authorsResolver.author(id.toHexString()),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });
  });

  describe('allAuthors()', () => {
    it('Serviceから正常に取得できたらそれを返す', async () => {
      jest
        .spyOn(authorsService, 'all')
        .mockResolvedValueOnce([] as AuthorDocument[]);

      const actual = await authorsResolver.allAuthors();
      expect(actual).toBeDefined();
    });
  });

  describe('id()', () => {
    it('Serviceから正常に取得できたらそれをstringに戻して返す', async () => {
      const expected = new ObjectId();
      jest.spyOn(authorsService, 'id').mockReturnValueOnce(expected);

      const actual = await authorsResolver.id({
        _id: expected,
      } as AuthorDocument);
      expect(actual).toStrictEqual(expected.toHexString());
    });
  });

  describe('books()', () => {
    it('Serviceから正常に取得できたらそれを返す', async () => {
      jest
        .spyOn(authorsService, 'books')
        .mockResolvedValue({} as RelayConnection<BookDocument>);

      const actual = await authorsResolver.books(
        {} as AuthorDocument,
        {} as AuthorBooksArgs,
      );
      expect(actual).toBeDefined();
    });
  });

  describe('createAuthor()', () => {
    it('Serviceが正常に実行できたらそれを返す', async () => {
      jest
        .spyOn(authorsService, 'create')
        .mockResolvedValue({} as AuthorDocument);

      const actual = await authorsResolver.createAuthor(
        {} as CreateAuthorInput,
      );
      expect(actual).toBeDefined();
    });
  });
});
