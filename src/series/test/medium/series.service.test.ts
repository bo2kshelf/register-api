import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {
  BookSeriesConnection,
  BookSeriesRelatedBookConnection,
} from '../../../books/connection/series.connection';
import {Book, BookSchema} from '../../../books/schema/book.schema';
import {DuplicateValueInArrayError} from '../../../error/duplicate-values-in-array.error';
import {EmptyArrayError} from '../../../error/empty-array.error';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {PaginateModule} from '../../../paginate/paginate.module';
import {Series, SeriesSchema} from '../../schema/series.schema';
import {SeriesService} from '../../series.service';

describe('SeriesService', () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let bookModel: Model<Book>;
  let seriesModel: Model<Series>;

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
        PaginateModule,
      ],
      providers: [SeriesService],
    }).compile();

    bookModel = module.get<Model<Book>>(getModelToken(Book.name));
    seriesModel = module.get<Model<Series>>(getModelToken(Series.name));

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
      const newSeries = await seriesModel.create({
        title: 'よふかしのうた',
        books: [],
        relatedBooks: [],
      });

      const actual = seriesService.id(newSeries);

      expect(actual).toBe(newSeries._id);
    });
  });

  describe('getById()', () => {
    it('存在する場合はそれを返す', async () => {
      const newSeries = await seriesModel.create({
        title: 'よふかしのうた',
        books: [],
        relatedBooks: [],
      });

      const actual = await seriesService.getById(seriesService.id(newSeries));

      expect(actual).toHaveProperty('title', 'よふかしのうた');
    });

    it('存在しない場合はError', async () => {
      await expect(() =>
        seriesService.getById(new ObjectId('5fccac3585e5265603349e97')),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });
  });

  describe('create()', () => {
    let book1: Book;
    let book2: Book;

    beforeEach(async () => {
      book1 = await bookModel.create({
        title: 'よふかしのうた(1)',
        authors: [],
      });
      book2 = await bookModel.create({
        title: 'よふかしのうた(2)',
        authors: [],
      });
    });

    afterEach(async () => {
      await bookModel.deleteMany({});
    });

    it('全てのプロパティが存在する', async () => {
      const actual = await seriesService.create({
        title: 'よふかしのうた',
        books: [{id: book1._id, serial: 1}],
        relatedBooks: [{id: book1._id}],
      });

      expect(actual).toHaveProperty('title', 'よふかしのうた');
      expect(actual).toHaveProperty('relatedBooks');
    });

    it('booksが空の場合はError', async () => {
      await expect(() =>
        seriesService.create({
          title: 'よふかしのうた',
          books: [],
        }),
      ).rejects.toThrow(EmptyArrayError);
    });

    it('booksのIDが重複している場合Error', async () => {
      await expect(() =>
        seriesService.create({
          title: 'よふかしのうた',
          books: [
            {id: book1._id, serial: 1},
            {id: book1._id, serial: 2},
          ],
        }),
      ).rejects.toThrow(DuplicateValueInArrayError);
    });

    it('booksのserialが重複している場合Error', async () => {
      await expect(() =>
        seriesService.create({
          title: 'よふかしのうた',
          books: [
            {id: book1._id, serial: 1},
            {id: book2._id, serial: 1},
          ],
        }),
      ).rejects.toThrow(DuplicateValueInArrayError);
    });

    it('idに結びついたbooksが存在しない場合はError', async () => {
      await bookModel.deleteMany({});

      await expect(() =>
        seriesService.create({
          title: 'よふかしのうた',
          books: [{id: book1._id, serial: 1}],
        }),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('relatedBooksが欠落しても通る', async () => {
      const actual = await seriesService.create({
        title: 'よふかしのうた',
        books: [{id: book1._id, serial: 1}],
      });

      expect(actual).toHaveProperty('title', 'よふかしのうた');
      expect(actual).toHaveProperty('relatedBooks');
    });

    it('relatedBooksが重複している場合Error', async () => {
      await expect(() =>
        seriesService.create({
          title: 'よふかしのうた',
          books: [{id: book1._id, serial: 1}],
          relatedBooks: [{id: book1._id}, {id: book1._id}],
        }),
      ).rejects.toThrow(DuplicateValueInArrayError);
    });

    it('idに結びついたrelatedBooksが存在しない場合はError', async () => {
      await bookModel.deleteMany({});

      await expect(() =>
        seriesService.create({
          title: 'よふかしのうた',
          books: [{id: book1._id, serial: 1}],
          relatedBooks: [{id: book1._id}],
        }),
      ).rejects.toThrow(NoDocumentForObjectIdError);
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
        books: [] as BookSeriesConnection[],
      } as Series);

      await expect(() =>
        seriesService.addBookToBooks(newSeries._id, newBookId, 1),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('存在しないseriesのIdを入力すると例外を投げる', async () => {
      const newBook = await bookModel.create({} as Book);
      const newBookId = newBook._id;

      const newSeries = await seriesModel.create({
        books: [] as BookSeriesConnection[],
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
        relatedBooks: [] as BookSeriesRelatedBookConnection[],
      } as Series);

      await expect(() =>
        seriesService.addBookToRelatedBooks(newSeries._id, newBookId),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('存在しないseriesのIdを入力すると例外を投げる', async () => {
      const newBook = await bookModel.create({} as Book);
      const newBookId = newBook._id;

      const newSeries = await seriesModel.create({
        relatedBooks: [] as BookSeriesRelatedBookConnection[],
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
