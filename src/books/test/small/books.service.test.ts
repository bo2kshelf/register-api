import {getModelToken} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {AuthorDocument} from '../../../authors/schema/author.schema';
import {DuplicateValueInArrayError} from '../../../error/duplicate-values-in-array.error';
import {EmptyArrayError} from '../../../error/empty-array.error';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {modelMockFactory} from '../../../mongoose/model.mock.factory';
import {SeriesDocument} from '../../../series/schema/series.schema';
import {BooksService} from '../../books.service';
import {BookDocument} from '../../schema/book.schema';

describe(BooksService.name, () => {
  let module: TestingModule;

  let bookModel: Model<BookDocument>;
  let authorModel: Model<AuthorDocument>;
  let seriesModel: Model<SeriesDocument>;

  let bookService: BooksService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: getModelToken(BookDocument.name),
          useFactory: modelMockFactory,
        },
        {
          provide: getModelToken(AuthorDocument.name),
          useFactory: modelMockFactory,
        },
        {
          provide: getModelToken(SeriesDocument.name),
          useFactory: modelMockFactory,
        },
        BooksService,
      ],
    }).compile();

    bookModel = module.get<Model<BookDocument>>(
      getModelToken(BookDocument.name),
    );
    authorModel = module.get<Model<AuthorDocument>>(
      getModelToken(AuthorDocument.name),
    );
    seriesModel = module.get<Model<SeriesDocument>>(
      getModelToken(SeriesDocument.name),
    );

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
      jest
        .spyOn(bookModel, 'findById')
        .mockResolvedValueOnce({} as BookDocument);

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
      jest.spyOn(bookModel, 'find').mockResolvedValueOnce([{} as BookDocument]);

      const actual = await bookService.all();
      expect(actual).toBeDefined();
    });
  });

  describe('id()', () => {
    it('引数の_idをそのまま返す', () => {
      const expected = new ObjectId();

      const actual = bookService.id({_id: expected} as BookDocument);

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
        .mockResolvedValueOnce([
          {_id: id1} as AuthorDocument,
          {_id: id2} as AuthorDocument,
        ]);

      await expect(() =>
        bookService.create({
          title: 'Title',
          authors: [{id: id1}, {id: id2}, {id: new ObjectId()}],
        }),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    describe('正常に生成する', () => {
      beforeEach(() => {
        jest
          .spyOn(bookModel, 'create')
          .mockResolvedValueOnce({} as BookDocument);
      });

      it('全てのプロパティが不足なくある', async () => {
        const id1 = new ObjectId();
        const id2 = new ObjectId();
        jest
          .spyOn(authorModel, 'find')
          .mockResolvedValueOnce([
            {_id: id1} as AuthorDocument,
            {_id: id2} as AuthorDocument,
          ]);
        jest
          .spyOn(bookModel, 'create')
          .mockResolvedValueOnce({} as BookDocument);

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
          .mockResolvedValueOnce([
            {_id: id1} as AuthorDocument,
            {_id: id2} as AuthorDocument,
          ]);
        jest
          .spyOn(bookModel, 'create')
          .mockResolvedValueOnce({} as BookDocument);

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
          .mockResolvedValueOnce([
            {_id: id1} as AuthorDocument,
            {_id: id2} as AuthorDocument,
          ]);
        jest
          .spyOn(bookModel, 'create')
          .mockResolvedValueOnce({} as BookDocument);

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
      jest
        .spyOn(seriesModel, 'aggregate')
        .mockResolvedValueOnce([{} as SeriesDocument]);

      const actual = await bookService.relatedSeries({
        _id: new ObjectId(),
      } as BookDocument);

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(1);
    });
  });
});
