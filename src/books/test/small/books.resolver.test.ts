import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {Series} from '../../../series/schema/series.schema';
import {BooksResolver} from '../../books.resolver';
import {BooksService} from '../../books.service';
import {Book} from '../../schema/book.schema';

jest.mock('../../books.service');

describe(BooksResolver.name, () => {
  let module: TestingModule;

  let booksService: BooksService;
  let booksResolver: BooksResolver;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [BooksService, BooksResolver],
    }).compile();

    booksService = module.get<BooksService>(BooksService);
    booksResolver = module.get<BooksResolver>(BooksResolver);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(booksService).toBeDefined();
  });

  describe('book()', () => {
    it('Serviceから正常に取得できたらそれを返す', async () => {
      jest.spyOn(booksService, 'getById').mockResolvedValueOnce({} as Book);

      const actual = await booksResolver.book(new ObjectId().toHexString());
      expect(actual).toBeDefined();
    });

    it('Serviceから例外が投げられたらそのまま投げる', async () => {
      const id = new ObjectId();

      jest
        .spyOn(booksService, 'getById')
        .mockRejectedValueOnce(new NoDocumentForObjectIdError(Book.name, id));

      await expect(() => booksResolver.book(id.toHexString())).rejects.toThrow(
        NoDocumentForObjectIdError,
      );
    });

    it('ObjectIdとして不正な値を入力すると例外発生', async () => {
      await expect(() =>
        booksResolver.book('Invalid ObjectId'),
      ).rejects.toThrow(Error);
    });
  });

  describe('allBooks()', () => {
    it('Serviceから正常に取得できたらそれを返す', async () => {
      jest.spyOn(booksService, 'all').mockResolvedValueOnce([] as Book[]);

      const actual = await booksResolver.allBooks();
      expect(actual).toBeDefined();
    });
  });

  describe('id()', () => {
    it('Serviceから正常に取得できたらそれをstringに戻して返す', async () => {
      const expected = new ObjectId();
      jest.spyOn(booksService, 'id').mockReturnValueOnce(expected);

      const actual = await booksResolver.id({_id: expected} as Book);
      expect(actual).toStrictEqual(expected.toHexString());
    });
  });

  describe('authors()', () => {
    it('Authorsを取得', async () => {
      const authorId1 = new ObjectId();
      const authorId2 = new ObjectId();
      const actual = booksResolver.authors({
        authors: [
          {id: authorId1, roles: ['Original']},
          {id: authorId2, roles: ['Illust']},
        ],
      } as Book);

      expect(actual).toBeDefined();
      expect(actual).toContainEqual({id: authorId1, roles: ['Original']});
      expect(actual).toContainEqual({id: authorId2, roles: ['Illust']});
    });
  });

  describe('relatedSeries()', () => {
    it('正常に取得', async () => {
      jest
        .spyOn(booksService, 'relatedSeries')
        .mockResolvedValueOnce([{} as Series, {} as Series]);

      const actual = await booksResolver.relatedSeries({
        _id: new ObjectId(),
      } as Book);

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(2);
    });
  });

  describe('createBook()', () => {
    it('Serviceが正常に実行できたらそれを返す', async () => {
      jest.spyOn(booksService, 'create').mockResolvedValue({} as Book);

      const actual = await booksResolver.createBook({
        title: 'Title',
        authors: [
          {id: new ObjectId().toHexString(), roles: ['Original']},
          {id: new ObjectId().toHexString(), roles: ['Illust']},
        ],
      });
      expect(actual).toBeDefined();
    });

    it('ObjectIdとして不正な値を入力すると例外発生', async () => {
      jest.spyOn(booksService, 'create').mockResolvedValue({} as Book);

      await expect(() =>
        booksResolver.createBook({
          title: 'Title',
          authors: [{id: 'Invalid ObjectId'}],
        }),
      ).rejects.toThrow(Error);
    });
  });
});
