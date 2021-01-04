import {getModelToken} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {Author} from '../../../authors/schema/author.schema';
import {SeriesBooksConnection} from '../../../books/connection/series-connection.entity';
import {BookDocument} from '../../../books/schema/book.schema';
import {DuplicateValueInArrayError} from '../../../error/duplicate-values-in-array.error';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {modelMockFactory} from '../../../mongoose/model.mock.factory';
import {RequiredPaginationArgs} from '../../../paginate/dto/required-pagination.args';
import {
  PaginateService,
  RelayConnection,
} from '../../../paginate/paginate.service';
import {SeriesDocument} from '../../schema/series.schema';
import {SeriesService} from '../../series.service';

jest.mock('../../../paginate/paginate.service');

describe(SeriesService.name, () => {
  let module: TestingModule;

  let seriesModel: Model<SeriesDocument>;
  let bookModel: Model<BookDocument>;

  let paginateService: PaginateService;
  let seriesService: SeriesService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: getModelToken(SeriesDocument.name),
          useFactory: modelMockFactory,
        },
        {
          provide: getModelToken(BookDocument.name),
          useFactory: modelMockFactory,
        },
        {
          provide: getModelToken(Author.name),
          useFactory: modelMockFactory,
        },
        PaginateService,
        SeriesService,
      ],
    }).compile();

    seriesModel = module.get<Model<SeriesDocument>>(
      getModelToken(SeriesDocument.name),
    );
    bookModel = module.get<Model<BookDocument>>(
      getModelToken(BookDocument.name),
    );

    paginateService = module.get<PaginateService>(PaginateService);
    seriesService = module.get<SeriesService>(SeriesService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(seriesService).toBeDefined();
  });

  describe('getById()', () => {
    it('正常に取得できたらそれを返す', async () => {
      jest
        .spyOn(seriesModel, 'findById')
        .mockResolvedValueOnce({} as SeriesDocument);

      const actual = await seriesService.getById(new ObjectId());
      expect(actual).toBeDefined();
    });

    it('存在しない場合は例外を投げる', async () => {
      jest.spyOn(seriesModel, 'findById').mockResolvedValueOnce(null);

      await expect(() => seriesService.getById(new ObjectId())).rejects.toThrow(
        NoDocumentForObjectIdError,
      );
    });
  });

  describe('all()', () => {
    it('受け取ったものをそのまま返す', async () => {
      jest
        .spyOn(seriesModel, 'find')
        .mockResolvedValueOnce([] as SeriesDocument[]);

      const actual = await seriesService.all();
      expect(actual).toBeDefined();
    });
  });

  describe('books()', () => {
    it('受け取ったものをそのまま返す', async () => {
      jest
        .spyOn(paginateService, 'getConnectionFromMongooseModel')
        .mockResolvedValueOnce(
          {} as RelayConnection<{id: ObjectId; serial: number}>,
        );

      const actual = await seriesService.books(
        {} as SeriesDocument,
        {} as RequiredPaginationArgs,
      );
      expect(actual).toBeDefined();
    });
  });

  describe('relatedBooks()', () => {
    it('受け取ったものをそのまま返す', async () => {
      jest
        .spyOn(paginateService, 'getConnectionFromMongooseModel')
        .mockResolvedValueOnce({} as RelayConnection<{id: ObjectId}>);

      const actual = await seriesService.relatedBooks(
        {} as SeriesDocument,
        {} as RequiredPaginationArgs,
      );
      expect(actual).toBeDefined();
    });
  });

  describe('id()', () => {
    it('引数の_idをそのまま返す', () => {
      const expected = new ObjectId();

      const actual = seriesService.id({_id: expected} as SeriesDocument);

      expect(actual).toStrictEqual(expected);
    });
  });

  describe('create()', () => {
    it('books.idが重複していたら例外を投げる', async () => {
      const dupl = new ObjectId();
      await expect(() =>
        seriesService.create({
          title: 'Title',
          books: [
            {id: dupl, serial: 1},
            {id: dupl, serial: 2},
            {id: new ObjectId(), serial: 3},
          ],
          relatedBooks: [],
        }),
      ).rejects.toThrow(DuplicateValueInArrayError);
    });

    it('books.serialが重複していたら例外を投げる', async () => {
      await expect(() =>
        seriesService.create({
          title: 'Title',
          books: [
            {id: new ObjectId(), serial: 1},
            {id: new ObjectId(), serial: 1},
            {id: new ObjectId(), serial: 2},
          ],
          relatedBooks: [],
        }),
      ).rejects.toThrow(DuplicateValueInArrayError);
    });

    it('booksで一つでも取得不可能なものがあったら例外を投げる', async () => {
      const id1 = new ObjectId();
      const id2 = new ObjectId();
      jest
        .spyOn(bookModel, 'find')
        .mockResolvedValueOnce([
          {_id: id1} as BookDocument,
          {_id: id2} as BookDocument,
        ]);

      await expect(() =>
        seriesService.create({
          title: 'Title',
          books: [
            {id: id1, serial: 1},
            {id: id2, serial: 2},
            {id: new ObjectId(), serial: 3},
          ],
          relatedBooks: [],
        }),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('relatedBooks.idが重複していたら例外を投げる', async () => {
      jest
        .spyOn(bookModel, 'find')
        .mockResolvedValueOnce([
          {_id: new ObjectId()} as BookDocument,
          {_id: new ObjectId()} as BookDocument,
        ]);

      const dupl = new ObjectId();
      await expect(() =>
        seriesService.create({
          title: 'title',
          books: [
            {id: new ObjectId(), serial: 1},
            {id: new ObjectId(), serial: 2},
          ],
          relatedBooks: [{id: dupl}, {id: dupl}],
        }),
      ).rejects.toThrow(DuplicateValueInArrayError);
    });

    it('relatedBooksで一つでも取得不可能なものがあった場合例外を投げる', async () => {
      const id1 = new ObjectId();
      const id2 = new ObjectId();
      jest
        .spyOn(bookModel, 'find')
        .mockResolvedValueOnce([
          {_id: new ObjectId()} as BookDocument,
          {_id: new ObjectId()} as BookDocument,
        ])
        .mockResolvedValueOnce([
          {_id: id1} as BookDocument,
          {_id: id2} as BookDocument,
        ]);

      await expect(() =>
        seriesService.create({
          title: 'Title',
          books: [
            {id: new ObjectId(), serial: 1},
            {id: new ObjectId(), serial: 2},
          ],
          relatedBooks: [{id: id1}, {id: id2}, {id: new ObjectId()}],
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
        jest
          .spyOn(bookModel, 'find')
          .mockResolvedValueOnce([
            {_id: new ObjectId()} as BookDocument,
            {_id: new ObjectId()} as BookDocument,
          ])
          .mockResolvedValueOnce([
            {_id: new ObjectId()} as BookDocument,
            {_id: new ObjectId()} as BookDocument,
          ]);
        jest
          .spyOn(seriesModel, 'create')
          .mockResolvedValueOnce({} as SeriesDocument);

        const actual = await seriesService.create({
          title: 'Title',
          books: [
            {id: new ObjectId(), serial: 1},
            {id: new ObjectId(), serial: 2},
          ],
          relatedBooks: [{id: new ObjectId()}, {id: new ObjectId()}],
        });

        expect(actual).toBeDefined();
      });

      it('booksが空配列', async () => {
        jest
          .spyOn(bookModel, 'find')
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            {_id: new ObjectId()} as BookDocument,
            {_id: new ObjectId()} as BookDocument,
          ]);
        jest
          .spyOn(seriesModel, 'create')
          .mockResolvedValueOnce({} as SeriesDocument);

        const actual = await seriesService.create({
          title: 'Title',
          books: [],
          relatedBooks: [{id: new ObjectId()}, {id: new ObjectId()}],
        });

        expect(actual).toBeDefined();
      });

      it('relatedBooksが空配列', async () => {
        jest
          .spyOn(bookModel, 'find')
          .mockResolvedValueOnce([
            {_id: new ObjectId()} as BookDocument,
            {_id: new ObjectId()} as BookDocument,
          ])
          .mockResolvedValueOnce([]);
        jest
          .spyOn(seriesModel, 'create')
          .mockResolvedValueOnce({} as SeriesDocument);

        const actual = await seriesService.create({
          title: 'Title',
          books: [
            {id: new ObjectId(), serial: 1},
            {id: new ObjectId(), serial: 2},
          ],
          relatedBooks: [],
        });

        expect(actual).toBeDefined();
      });
    });
  });

  describe('getLastSerial()', () => {
    it('booksが一件もない場合は1を返す', () => {
      expect(
        seriesService.getLastSerial({
          books: [] as SeriesBooksConnection[],
        } as SeriesDocument),
      ).toBe(1);
    });

    it('booksがある場合は最も大きなserialを返す', () => {
      expect(
        seriesService.getLastSerial({
          books: [
            {serial: 1} as SeriesBooksConnection,
            {serial: 2} as SeriesBooksConnection,
            {serial: 1.5} as SeriesBooksConnection,
          ],
        } as SeriesDocument),
      ).toBe(2);
    });
  });

  describe('addBookToBooks()', () => {
    it('存在しないbookのIdを入力すると例外を投げる', async () => {
      jest.spyOn(bookModel, 'findById').mockResolvedValueOnce(null);

      await expect(() =>
        seriesService.addBookToBooks(new ObjectId(), new ObjectId(), 1),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('bookが重複していたら例外を投げる', async () => {
      const bookId = new ObjectId();
      jest
        .spyOn(bookModel, 'findById')
        .mockResolvedValueOnce({_id: bookId} as BookDocument);
      jest
        .spyOn(seriesModel, 'findOne')
        .mockResolvedValueOnce({} as SeriesDocument);

      const seriesId = new ObjectId();

      await expect(() =>
        seriesService.addBookToBooks(seriesId, bookId, 2),
      ).rejects.toThrow(
        `Already exists serial 2 or book ${bookId.toHexString()} in series ${seriesId.toHexString()}.`,
      );
    });

    it('serialが重複していたら例外を投げる', async () => {
      const bookId = new ObjectId();
      const serial = 2;
      jest
        .spyOn(bookModel, 'findById')
        .mockResolvedValueOnce({_id: bookId} as BookDocument);
      jest
        .spyOn(seriesModel, 'findOne')
        .mockResolvedValueOnce({} as SeriesDocument);

      const seriesId = new ObjectId();

      await expect(() =>
        seriesService.addBookToBooks(seriesId, bookId, serial),
      ).rejects.toThrow(
        `Already exists serial ${serial} or book ${bookId.toHexString()} in series ${seriesId.toHexString()}.`,
      );
    });

    it('seriesが存在しないならば例外を投げる', async () => {
      jest.spyOn(bookModel, 'findById').mockResolvedValueOnce(null);
      jest.spyOn(seriesModel, 'findByIdAndUpdate').mockResolvedValueOnce(null);

      await expect(() =>
        seriesService.addBookToBooks(new ObjectId(), new ObjectId(), 1),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('正常に動作する', async () => {
      const series: SeriesDocument = {
        books: [
          {serial: 1} as SeriesBooksConnection,
          {serial: 2} as SeriesBooksConnection,
          {serial: 3} as SeriesBooksConnection,
        ] as SeriesBooksConnection[],
      } as SeriesDocument;

      jest.spyOn(bookModel, 'findById').mockResolvedValue({} as BookDocument);
      jest.spyOn(seriesModel, 'findOne').mockResolvedValueOnce(null);

      const mockedFn = jest
        .spyOn(seriesModel, 'findByIdAndUpdate')
        .mockResolvedValueOnce({
          ...series,
          books: [...series.books, {serial: 2.5} as SeriesBooksConnection],
        } as SeriesDocument);

      await seriesService.addBookToBooks(series._id, new ObjectId(), 2.5);

      expect(mockedFn).toHaveBeenCalled();
    });
  });

  describe('addBookToRelatedBooks()', () => {
    it('存在しないbookのIdを入力すると例外を投げる', async () => {
      jest.spyOn(bookModel, 'findById').mockResolvedValueOnce(null);

      await expect(() =>
        seriesService.addBookToRelatedBooks(new ObjectId(), new ObjectId()),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('bookが重複していたら例外を投げる', async () => {
      const bookId = new ObjectId();
      jest
        .spyOn(bookModel, 'findById')
        .mockResolvedValueOnce({_id: bookId} as BookDocument);
      jest
        .spyOn(seriesModel, 'findOne')
        .mockResolvedValueOnce({} as SeriesDocument);

      const seriesId = new ObjectId();

      await expect(() =>
        seriesService.addBookToRelatedBooks(seriesId, bookId),
      ).rejects.toThrow(
        `Already exists book ${bookId.toHexString()} in series ${seriesId.toHexString()}.`,
      );
    });

    it('seriesが存在しないならば例外を投げる', async () => {
      jest.spyOn(bookModel, 'findById').mockResolvedValueOnce(null);
      jest.spyOn(seriesModel, 'findByIdAndUpdate').mockResolvedValueOnce(null);

      await expect(() =>
        seriesService.addBookToRelatedBooks(new ObjectId(), new ObjectId()),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('正常に動作する', async () => {
      const series: SeriesDocument = {
        books: [
          {serial: 1} as SeriesBooksConnection,
          {serial: 2} as SeriesBooksConnection,
          {serial: 3} as SeriesBooksConnection,
        ] as SeriesBooksConnection[],
      } as SeriesDocument;

      jest.spyOn(bookModel, 'findById').mockResolvedValue({} as BookDocument);
      jest.spyOn(seriesModel, 'findOne').mockResolvedValueOnce(null);

      const mockedFn = jest
        .spyOn(seriesModel, 'findByIdAndUpdate')
        .mockResolvedValueOnce({
          ...series,
          books: [...series.books, {serial: 2.5} as SeriesBooksConnection],
        } as SeriesDocument);

      await seriesService.addBookToRelatedBooks(series._id, new ObjectId());

      expect(mockedFn).toHaveBeenCalled();
    });
  });
});
