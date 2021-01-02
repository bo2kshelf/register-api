import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {
  SeriesBooksConnection,
  SeriesRelatedBooksConnection,
} from '../../../books/connection/series-connection.entity';
import {Book, BookSchema} from '../../../books/schema/book.schema';
import {DuplicateValueInArrayError} from '../../../error/duplicate-values-in-array.error';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {RequiredPaginationArgs} from '../../../paginate/dto/required-pagination.args';
import {
  PaginateService,
  RelayConnection,
} from '../../../paginate/paginate.service';
import {Series, SeriesSchema} from '../../schema/series.schema';
import {SeriesService} from '../../series.service';

jest.mock('../../../paginate/paginate.service');

describe(SeriesService.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let bookModel: Model<Book>;
  let seriesModel: Model<Series>;

  let paginateService: PaginateService;
  let seriesService: SeriesService;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          useFactory: async () => ({uri: await mongoServer.getUri()}),
        }),
        MongooseModule.forFeature([
          {name: Book.name, schema: BookSchema},
          {name: Series.name, schema: SeriesSchema},
        ]),
      ],
      providers: [PaginateService, SeriesService],
    }).compile();

    bookModel = module.get<Model<Book>>(getModelToken(Book.name));
    seriesModel = module.get<Model<Series>>(getModelToken(Series.name));

    paginateService = module.get<PaginateService>(PaginateService);
    seriesService = module.get<SeriesService>(SeriesService);
  });

  afterEach(async () => {
    jest.clearAllMocks();

    await seriesModel.deleteMany({});
    await bookModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoServer.stop();

    await module.close();
  });

  it('should be defined', () => {
    expect(seriesService).toBeDefined();
  });

  describe('id()', () => {
    it('ObjectIDを取得', async () => {
      const expected = new ObjectId();
      const newSeries = await seriesModel.create({
        _id: expected,
        title: 'Title',
        books: [],
        relatedBooks: [],
      });
      const actual = seriesService.id(newSeries);

      expect(actual).toBe(expected);
    });
  });

  describe('getById()', () => {
    let series: Series;
    let seriesId: ObjectId;
    beforeEach(async () => {
      series = await seriesModel.create({
        title: 'Title',
        books: [],
        relatedBooks: [],
      });
      seriesId = series._id;
    });

    it('存在する場合はそれを返す', async () => {
      const actual = await seriesService.getById(seriesId);

      expect(actual).toBeDefined();
      expect(actual).toHaveProperty('_id', seriesId);
      expect(actual).toHaveProperty('title', series.title);
    });

    it('存在しない場合は例外を投げる', async () => {
      await series.remove();
      await expect(() => seriesService.getById(seriesId)).rejects.toThrow(
        NoDocumentForObjectIdError,
      );
    });
  });

  describe('all()', () => {
    it('何もなければ空配列を返す', async () => {
      const actual = await seriesService.all();

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(0);
    });

    it('存在するならば配列を返す', async () => {
      for (let i = 0; i < 5; i++)
        await seriesModel.create({title: 'Title', books: [], relatedBooks: []});

      const actual = await seriesService.all();

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(5);
    });
  });

  describe('books()', () => {
    let series: Series;
    beforeEach(async () => {
      series = await seriesModel.create({
        title: 'Title',
        books: [],
        relatedBooks: [],
      });
    });

    it('受け取ったものをそのまま返す', async () => {
      jest
        .spyOn(paginateService, 'getConnectionFromMongooseModel')
        .mockResolvedValueOnce(
          {} as RelayConnection<{id: ObjectId; serial: number}>,
        );

      const actual = await seriesService.books(
        series,
        {} as RequiredPaginationArgs,
      );
      expect(actual).toBeDefined();
    });
  });

  describe('relatedBooks()', () => {
    let series: Series;
    beforeEach(async () => {
      series = await seriesModel.create({
        title: 'Title',
        books: [],
        relatedBooks: [],
      });
    });

    it('受け取ったものをそのまま返す', async () => {
      jest
        .spyOn(paginateService, 'getConnectionFromMongooseModel')
        .mockResolvedValueOnce({} as RelayConnection<{id: ObjectId}>);

      const actual = await seriesService.relatedBooks(
        series,
        {} as RequiredPaginationArgs,
      );
      expect(actual).toBeDefined();
    });
  });

  describe('create()', () => {
    let book1: Book;
    let book2: Book;
    let book3: Book;
    let book4: Book;

    beforeEach(async () => {
      book1 = await bookModel.create({title: 'Book 1', authors: []});
      book2 = await bookModel.create({title: 'Book 2', authors: []});
      book3 = await bookModel.create({title: 'Book 3', authors: []});
      book4 = await bookModel.create({title: 'Book 4', authors: []});
    });

    afterEach(async () => {
      await bookModel.deleteMany({});
    });

    it('books.idが重複していたら例外を投げる', async () => {
      await expect(() =>
        seriesService.create({
          title: 'Title',
          books: [
            {id: book1._id, serial: 1},
            {id: book1._id, serial: 2},
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
            {id: book1._id, serial: 1},
            {id: book2._id, serial: 1},
          ],
          relatedBooks: [],
        }),
      ).rejects.toThrow(DuplicateValueInArrayError);
    });

    it('booksで一つでも取得不可能なものがあったら例外を投げる', async () => {
      await book1.remove();
      await expect(() =>
        seriesService.create({
          title: 'Title',
          books: [
            {id: book1._id, serial: 1},
            {id: book2._id, serial: 2},
          ],
          relatedBooks: [],
        }),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('relatedBooks.idが重複していたら例外を投げる', async () => {
      await expect(() =>
        seriesService.create({
          title: 'Title',
          books: [{id: book1._id, serial: 1}],
          relatedBooks: [{id: book3._id}, {id: book3._id}],
        }),
      ).rejects.toThrow(DuplicateValueInArrayError);
    });

    it('relatedBooksで一つでも取得不可能なものがあったら例外を投げる', async () => {
      await book3.remove();

      await expect(() =>
        seriesService.create({
          title: 'Title',
          books: [{id: book1._id, serial: 1}],
          relatedBooks: [{id: book3._id}, {id: book4._id}],
        }),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    describe('正常に生成する', () => {
      it('全てのプロパティが不足なくある', async () => {
        const actual = await seriesService.create({
          title: 'Title',
          books: [
            {id: book1._id, serial: 1},
            {id: book2._id, serial: 2},
          ],
          relatedBooks: [{id: book3._id}, {id: book4._id}],
        });

        expect(actual).toBeDefined();
        expect(actual).toHaveProperty('title', 'Title');

        expect(actual.books).toBeDefined();
        expect(actual.books).toContainEqual({id: book1._id, serial: 1});
        expect(actual.books).toContainEqual({id: book2._id, serial: 2});

        expect(actual.relatedBooks).toBeDefined();
        expect(actual.relatedBooks).toContainEqual({id: book3._id});
        expect(actual.relatedBooks).toContainEqual({id: book4._id});
      });

      it('booksが空配列', async () => {
        const actual = await seriesService.create({
          title: 'Title',
          books: [],
          relatedBooks: [{id: book1._id}, {id: book2._id}],
        });

        expect(actual).toBeDefined();
        expect(actual).toHaveProperty('title', 'Title');

        expect(actual.books).toBeDefined();

        expect(actual.relatedBooks).toBeDefined();
        expect(actual.relatedBooks).toContainEqual({id: book1._id});
        expect(actual.relatedBooks).toContainEqual({id: book2._id});
      });

      it('relatedBooksが空配列', async () => {
        const actual = await seriesService.create({
          title: 'Title',
          books: [
            {id: book1._id, serial: 1},
            {id: book2._id, serial: 2},
          ],
          relatedBooks: [],
        });

        expect(actual).toBeDefined();
        expect(actual).toHaveProperty('title', 'Title');

        expect(actual.books).toBeDefined();
        expect(actual.books).toContainEqual({id: book1._id, serial: 1});
        expect(actual.books).toContainEqual({id: book2._id, serial: 2});

        expect(actual.relatedBooks).toBeDefined();
      });
    });
  });

  describe('addBookToBooks()', () => {
    it('正常に追加する', async () => {
      const newBook = await bookModel.create({} as Book);

      const newSeries = await seriesModel.create({
        books: [
          {id: new ObjectId(), serial: 1},
          {id: new ObjectId(), serial: 2},
          {id: new ObjectId(), serial: 3},
        ],
      } as Series);

      const actual: Series = await seriesService.addBookToBooks(
        newSeries._id,
        newBook._id,
        4,
      );
      expect(actual).toBeDefined();
      expect(actual.books).toHaveLength(4);
    });

    it('存在しないbookのIdを入力すると例外を投げる', async () => {
      const newBook = await bookModel.create({} as Book);
      const newBookId = newBook._id;
      await newBook.deleteOne();

      const newSeries = await seriesModel.create({
        books: [] as SeriesBooksConnection[],
      } as Series);

      await expect(() =>
        seriesService.addBookToBooks(newSeries._id, newBookId, 1),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('存在しないseriesのIdを入力すると例外を投げる', async () => {
      const newBook = await bookModel.create({} as Book);
      const newBookId = newBook._id;

      const newSeries = await seriesModel.create({
        books: [] as SeriesBooksConnection[],
      } as Series);
      const newSeriesId = newSeries._id;
      await newSeries.deleteOne();

      await expect(() =>
        seriesService.addBookToBooks(newSeriesId, newBookId, 1),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('bookが重複していると例外を投げる', async () => {
      const eixstBook = await bookModel.create({} as Book);

      const newSeries = await seriesModel.create({
        books: [
          {id: new ObjectId(), serial: 1},
          {id: new ObjectId(), serial: 2},
          {id: eixstBook._id, serial: 3},
        ],
      } as Series);

      await expect(() =>
        seriesService.addBookToBooks(newSeries._id, eixstBook._id, 4),
      ).rejects.toThrow(
        `Already exists serial 4 or book ${eixstBook._id.toHexString()} in series ${newSeries._id.toHexString()}.`,
      );
    });

    it('serialが重複していると例外を投げる', async () => {
      const newBook = await bookModel.create({} as Book);

      const newSeries = await seriesModel.create({
        books: [
          {id: new ObjectId(), serial: 1},
          {id: new ObjectId(), serial: 2},
          {id: new ObjectId(), serial: 3},
        ],
      } as Series);

      await expect(() =>
        seriesService.addBookToBooks(newSeries._id, newBook._id, 1),
      ).rejects.toThrow(
        `Already exists serial 1 or book ${newBook._id.toHexString()} in series ${newSeries._id.toHexString()}.`,
      );
    });
  });

  describe('addBookToRelatedBooks()', () => {
    it('正常に追加する', async () => {
      const newBook = await bookModel.create({} as Book);

      const newSeries = await seriesModel.create({
        relatedBooks: [
          {id: new ObjectId()},
          {id: new ObjectId()},
          {id: new ObjectId()},
        ],
      } as Series);

      const actual: Series = await seriesService.addBookToRelatedBooks(
        newSeries._id,
        newBook._id,
      );
      expect(actual).toBeDefined();
      expect(actual.relatedBooks).toHaveLength(4);
    });

    it('存在しないbookのIdを入力すると例外を投げる', async () => {
      const newBook = await bookModel.create({} as Book);
      const newBookId = newBook._id;
      await newBook.deleteOne();

      const newSeries = await seriesModel.create({
        relatedBooks: [] as SeriesRelatedBooksConnection[],
      } as Series);

      await expect(() =>
        seriesService.addBookToRelatedBooks(newSeries._id, newBookId),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('存在しないseriesのIdを入力すると例外を投げる', async () => {
      const newBook = await bookModel.create({} as Book);
      const newBookId = newBook._id;

      const newSeries = await seriesModel.create({
        relatedBooks: [] as SeriesRelatedBooksConnection[],
      } as Series);
      const newSeriesId = newSeries._id;
      await newSeries.deleteOne();

      await expect(() =>
        seriesService.addBookToRelatedBooks(newSeriesId, newBookId),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('bookが重複していると例外を投げる', async () => {
      const eixstBook = await bookModel.create({} as Book);

      const newSeries = await seriesModel.create({
        relatedBooks: [
          {id: new ObjectId()},
          {id: new ObjectId()},
          {id: eixstBook._id},
        ],
      } as Series);

      await expect(() =>
        seriesService.addBookToRelatedBooks(newSeries._id, eixstBook._id),
      ).rejects.toThrow(
        `Already exists book ${eixstBook._id.toHexString()} in series ${newSeries._id.toHexString()}.`,
      );
    });
  });
});
