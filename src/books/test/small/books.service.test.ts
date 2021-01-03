import {getModelToken} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {Author} from '../../../authors/schema/author.schema';
import {DuplicateValueInArrayError} from '../../../error/duplicate-values-in-array.error';
import {EmptyArrayError} from '../../../error/empty-array.error';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {modelMockFactory} from '../../../mongoose/model.mock.factory';
import {Series} from '../../../series/schema/series.schema';
import {BooksService} from '../../books.service';
import {Book} from '../../schema/book.schema';

describe(BooksService.name, () => {
  let module: TestingModule;

  let bookModel: Model<Book>;
  let authorModel: Model<Author>;

  let bookService: BooksService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: getModelToken(Book.name),
          useFactory: modelMockFactory,
        },
        {
          provide: getModelToken(Author.name),
          useFactory: modelMockFactory,
        },
        BooksService,
      ],
    }).compile();

    bookModel = module.get<Model<Book>>(getModelToken(Book.name));
    authorModel = module.get<Model<Author>>(getModelToken(Author.name));

    bookService = module.get<BooksService>(BooksService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(bookService).toBeDefined();
  });

  describe('getById()', () => {
    it('正常に取得できたらそれを返す', async () => {
      jest.spyOn(bookModel, 'findById').mockResolvedValueOnce({} as Book);

      const actual = await bookService.getById(new ObjectId());
      expect(actual).toBeDefined();
    });

    it('存在しない場合は例外を投げる', async () => {
      jest.spyOn(bookModel, 'findById').mockResolvedValueOnce(null);

      await expect(() => bookService.getById(new ObjectId())).rejects.toThrow(
        NoDocumentForObjectIdError,
      );
    });
  });

  describe('all()', () => {
    it('受け取ったものをそのまま返す', async () => {
      jest.spyOn(bookModel, 'find').mockResolvedValueOnce([{} as Book]);

      const actual = await bookService.all();
      expect(actual).toBeDefined();
    });
  });

  describe('id()', () => {
    it('引数の_idをそのまま返す', () => {
      const expected = new ObjectId();

      const actual = bookService.id({_id: expected} as Book);

      expect(actual).toStrictEqual(expected);
    });
  });

  describe('create()', () => {
    it('authorsが空配列ならば例外を投げる', async () => {
      await expect(() =>
        bookService.create({
          title: 'Title',
          authors: [],
        }),
      ).rejects.toThrow(EmptyArrayError);
    });

    it('authors.idに重複があるならば例外を投げる', async () => {
      const dupl = new ObjectId();
      await expect(() =>
        bookService.create({
          title: 'Title',
          authors: [{id: dupl}, {id: dupl}, {id: new ObjectId()}],
        }),
      ).rejects.toThrow(DuplicateValueInArrayError);
    });

    it('該当するAuthorが一つでも存在しなければ例外を投げる', async () => {
      const id1 = new ObjectId();
      const id2 = new ObjectId();
      jest
        .spyOn(authorModel, 'find')
        .mockResolvedValueOnce([{_id: id1} as Author, {_id: id2} as Author]);

      await expect(() =>
        bookService.create({
          title: 'Title',
          authors: [{id: id1}, {id: id2}, {id: new ObjectId()}],
        }),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    describe('正常に生成する', () => {
      beforeEach(() => {
        jest.spyOn(bookModel, 'create').mockResolvedValueOnce({} as Book);
      });

      it('全てのプロパティが不足なくある', async () => {
        const id1 = new ObjectId();
        const id2 = new ObjectId();
        jest
          .spyOn(authorModel, 'find')
          .mockResolvedValueOnce([{_id: id1} as Author, {_id: id2} as Author]);
        jest.spyOn(bookModel, 'create').mockResolvedValueOnce({} as Book);

        const actual = await bookService.create({
          title: 'title',
          isbn: '9784091294920',
          authors: [
            {id: id1, roles: ['Original']},
            {id: id2, roles: ['Illust']},
          ],
        });

        expect(actual).toBeDefined();
      });

      it('ISBNが存在しない', async () => {
        const id1 = new ObjectId();
        const id2 = new ObjectId();
        jest
          .spyOn(authorModel, 'find')
          .mockResolvedValueOnce([{_id: id1} as Author, {_id: id2} as Author]);
        jest.spyOn(bookModel, 'create').mockResolvedValueOnce({} as Book);

        const actual = await bookService.create({
          title: 'title',
          authors: [
            {id: new ObjectId(), roles: ['Original']},
            {id: new ObjectId(), roles: ['Illust']},
          ],
        });

        expect(actual).toBeDefined();
      });

      it('authors.rolesが存在しない', async () => {
        const id1 = new ObjectId();
        const id2 = new ObjectId();
        jest
          .spyOn(authorModel, 'find')
          .mockResolvedValueOnce([{_id: id1} as Author, {_id: id2} as Author]);
        jest.spyOn(bookModel, 'create').mockResolvedValueOnce({} as Book);

        const actual = await bookService.create({
          title: 'title',
          isbn: '9784091294920',
          authors: [{id: id1}, {id: id2}],
        });

        expect(actual).toBeDefined();
      });
    });
  });

  describe('relatedSeries()', () => {
    it('正常に取得出来る', async () => {
      jest.spyOn(bookModel, 'aggregate').mockResolvedValueOnce([{} as Series]);

      const actual = await bookService.relatedSeries({
        _id: new ObjectId(),
      } as Book);

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(1);
    });
  });
});
