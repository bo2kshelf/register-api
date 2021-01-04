import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {
  AuthorDocument,
  AuthorSchema,
} from '../../../authors/schema/author.schema';
import {
  SeriesBooksConnection,
  SeriesRelatedBooksConnection,
} from '../../../books/connection/series-connection.entity';
import {BookDocument, BookSchema} from '../../../books/schema/book.schema';
import {DuplicateValueInArrayError} from '../../../error/duplicate-values-in-array.error';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {RequiredPaginationArgs} from '../../../paginate/dto/required-pagination.args';
import {
  PaginateService,
  RelayConnection,
} from '../../../paginate/paginate.service';
import {SeriesDocument, SeriesSchema} from '../../schema/series.schema';
import {SeriesService} from '../../series.service';

jest.mock('../../../paginate/paginate.service');

describe(SeriesService.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let bookModel: Model<BookDocument>;
  let seriesModel: Model<SeriesDocument>;
  let authorsModel: Model<AuthorDocument>;

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
          {name: BookDocument.name, schema: BookSchema},
          {name: SeriesDocument.name, schema: SeriesSchema},
          {name: AuthorDocument.name, schema: AuthorSchema},
        ]),
      ],
      providers: [PaginateService, SeriesService],
    }).compile();

    bookModel = module.get<Model<BookDocument>>(
      getModelToken(BookDocument.name),
    );
    seriesModel = module.get<Model<SeriesDocument>>(
      getModelToken(SeriesDocument.name),
    );
    authorsModel = module.get<Model<AuthorDocument>>(
      getModelToken(AuthorDocument.name),
    );

    paginateService = module.get<PaginateService>(PaginateService);
    seriesService = module.get<SeriesService>(SeriesService);
  });

  afterEach(async () => {
    jest.clearAllMocks();

    await seriesModel.deleteMany({});
    await bookModel.deleteMany({});
    await authorsModel.deleteMany({});
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
    let series: SeriesDocument;
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
    let series: SeriesDocument;
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
    let series: SeriesDocument;
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
    let book1: BookDocument;
    let book2: BookDocument;
    let book3: BookDocument;
    let book4: BookDocument;

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
      const newBook = await bookModel.create({} as BookDocument);

      const newSeries = await seriesModel.create({
        books: [
          {id: new ObjectId(), serial: 1},
          {id: new ObjectId(), serial: 2},
          {id: new ObjectId(), serial: 3},
        ],
      } as SeriesDocument);

      const actual: SeriesDocument = await seriesService.addBookToBooks(
        newSeries._id,
        newBook._id,
        4,
      );
      expect(actual).toBeDefined();
      expect(actual.books).toHaveLength(4);
    });

    it('存在しないbookのIdを入力すると例外を投げる', async () => {
      const newBook = await bookModel.create({} as BookDocument);
      const newBookId = newBook._id;
      await newBook.deleteOne();

      const newSeries = await seriesModel.create({
        books: [] as SeriesBooksConnection[],
      } as SeriesDocument);

      await expect(() =>
        seriesService.addBookToBooks(newSeries._id, newBookId, 1),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('存在しないseriesのIdを入力すると例外を投げる', async () => {
      const newBook = await bookModel.create({} as BookDocument);
      const newBookId = newBook._id;

      const newSeries = await seriesModel.create({
        books: [] as SeriesBooksConnection[],
      } as SeriesDocument);
      const newSeriesId = newSeries._id;
      await newSeries.deleteOne();

      await expect(() =>
        seriesService.addBookToBooks(newSeriesId, newBookId, 1),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('bookが重複していると例外を投げる', async () => {
      const eixstBook = await bookModel.create({} as BookDocument);

      const newSeries = await seriesModel.create({
        books: [
          {id: new ObjectId(), serial: 1},
          {id: new ObjectId(), serial: 2},
          {id: eixstBook._id, serial: 3},
        ],
      } as SeriesDocument);

      await expect(() =>
        seriesService.addBookToBooks(newSeries._id, eixstBook._id, 4),
      ).rejects.toThrow(
        `Already exists serial 4 or book ${eixstBook._id.toHexString()} in series ${newSeries._id.toHexString()}.`,
      );
    });

    it('serialが重複していると例外を投げる', async () => {
      const newBook = await bookModel.create({} as BookDocument);

      const newSeries = await seriesModel.create({
        books: [
          {id: new ObjectId(), serial: 1},
          {id: new ObjectId(), serial: 2},
          {id: new ObjectId(), serial: 3},
        ],
      } as SeriesDocument);

      await expect(() =>
        seriesService.addBookToBooks(newSeries._id, newBook._id, 1),
      ).rejects.toThrow(
        `Already exists serial 1 or book ${newBook._id.toHexString()} in series ${newSeries._id.toHexString()}.`,
      );
    });
  });

  describe('addBookToRelatedBooks()', () => {
    it('正常に追加する', async () => {
      const newBook = await bookModel.create({} as BookDocument);

      const newSeries = await seriesModel.create({
        relatedBooks: [
          {id: new ObjectId()},
          {id: new ObjectId()},
          {id: new ObjectId()},
        ],
      } as SeriesDocument);

      const actual: SeriesDocument = await seriesService.addBookToRelatedBooks(
        newSeries._id,
        newBook._id,
      );
      expect(actual).toBeDefined();
      expect(actual.relatedBooks).toHaveLength(4);
    });

    it('存在しないbookのIdを入力すると例外を投げる', async () => {
      const newBook = await bookModel.create({} as BookDocument);
      const newBookId = newBook._id;
      await newBook.deleteOne();

      const newSeries = await seriesModel.create({
        relatedBooks: [] as SeriesRelatedBooksConnection[],
      } as SeriesDocument);

      await expect(() =>
        seriesService.addBookToRelatedBooks(newSeries._id, newBookId),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('存在しないseriesのIdを入力すると例外を投げる', async () => {
      const newBook = await bookModel.create({} as BookDocument);
      const newBookId = newBook._id;

      const newSeries = await seriesModel.create({
        relatedBooks: [] as SeriesRelatedBooksConnection[],
      } as SeriesDocument);
      const newSeriesId = newSeries._id;
      await newSeries.deleteOne();

      await expect(() =>
        seriesService.addBookToRelatedBooks(newSeriesId, newBookId),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('bookが重複していると例外を投げる', async () => {
      const eixstBook = await bookModel.create({} as BookDocument);

      const newSeries = await seriesModel.create({
        relatedBooks: [
          {id: new ObjectId()},
          {id: new ObjectId()},
          {id: eixstBook._id},
        ],
      } as SeriesDocument);

      await expect(() =>
        seriesService.addBookToRelatedBooks(newSeries._id, eixstBook._id),
      ).rejects.toThrow(
        `Already exists book ${eixstBook._id.toHexString()} in series ${newSeries._id.toHexString()}.`,
      );
    });
  });

  describe('relatedAuthors()', () => {
    let newAuthor1: AuthorDocument;
    let newAuthor2: AuthorDocument;
    let newAuthor3: AuthorDocument;
    let newAuthor4: AuthorDocument;

    beforeEach(async () => {
      newAuthor1 = await authorsModel.create({name: 'Author 1'});
      newAuthor2 = await authorsModel.create({name: 'Author 2'});
      newAuthor3 = await authorsModel.create({name: 'Author 3'});
      newAuthor4 = await authorsModel.create({name: 'Author 4'});
    });

    it('Series.booksの中に', async () => {
      const newBook1 = await bookModel.create({
        title: `Book 1`,
        authors: [{id: newAuthor1._id}, {id: newAuthor2._id}],
      });
      const newBook2 = await bookModel.create({
        title: `Book 2`,
        authors: [{id: newAuthor3._id}, {id: newAuthor4._id}],
      });

      const newSeries = await seriesModel.create({
        title: 'Series 1',
        books: [
          {id: newBook1._id, serial: 1},
          {id: newBook2._id, serial: 2},
        ],
        relatedBooks: [],
      });
      const actual = await seriesService.relatedAuthors(newSeries);

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(4);
      expect(actual.map(({_id, name}) => ({_id, name}))).toStrictEqual(
        expect.arrayContaining([
          {_id: newAuthor1._id, name: newAuthor1.name},
          {_id: newAuthor2._id, name: newAuthor2.name},
          {_id: newAuthor3._id, name: newAuthor3.name},
          {_id: newAuthor4._id, name: newAuthor4.name},
        ]),
      );
    });

    it('Series.relatedBooksの中に', async () => {
      const newBook1 = await bookModel.create({
        title: `Book 1`,
        authors: [{id: newAuthor1._id}, {id: newAuthor2._id}],
      });
      const newBook2 = await bookModel.create({
        title: `Book 2`,
        authors: [{id: newAuthor3._id}, {id: newAuthor4._id}],
      });

      const newSeries = await seriesModel.create({
        title: 'Series 1',
        books: [],
        relatedBooks: [{id: newBook1._id}, {id: newBook2._id}],
      });
      const actual = await seriesService.relatedAuthors(newSeries);

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(4);
      expect(actual.map(({_id, name}) => ({_id, name}))).toStrictEqual(
        expect.arrayContaining([
          {_id: newAuthor1._id, name: newAuthor1.name},
          {_id: newAuthor2._id, name: newAuthor2.name},
          {_id: newAuthor3._id, name: newAuthor3.name},
          {_id: newAuthor4._id, name: newAuthor4.name},
        ]),
      );
    });

    it('Series.booksとSeries.relatedBooksの両方から', async () => {
      const newBook1 = await bookModel.create({
        title: `Book 1`,
        authors: [{id: newAuthor1._id}, {id: newAuthor2._id}],
      });
      const newBook2 = await bookModel.create({
        title: `Book 2`,
        authors: [{id: newAuthor3._id}, {id: newAuthor4._id}],
      });

      const newSeries = await seriesModel.create({
        title: 'Series 1',
        books: [{id: newBook1._id, serial: 1}],
        relatedBooks: [{id: newBook2._id}],
      });
      const actual = await seriesService.relatedAuthors(newSeries);

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(4);
      expect(actual.map(({_id, name}) => ({_id, name}))).toStrictEqual(
        expect.arrayContaining([
          {_id: newAuthor1._id, name: newAuthor1.name},
          {_id: newAuthor2._id, name: newAuthor2.name},
          {_id: newAuthor3._id, name: newAuthor3.name},
          {_id: newAuthor4._id, name: newAuthor4.name},
        ]),
      );
    });

    it('重複しない', async () => {
      const newBook1 = await bookModel.create({
        title: `Book 1`,
        authors: [{id: newAuthor1._id}, {id: newAuthor2._id}],
      });
      const newBook2 = await bookModel.create({
        title: `Book 2`,
        authors: [{id: newAuthor1._id}, {id: newAuthor2._id}],
      });

      const newSeries = await seriesModel.create({
        title: 'Series 1',
        books: [
          {id: newBook1._id, serial: 1},
          {id: newBook2._id, serial: 2},
        ],
        relatedBooks: [],
      });
      const actual = await seriesService.relatedAuthors(newSeries);

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(2);
      expect(actual.map(({_id, name}) => ({_id, name}))).toStrictEqual(
        expect.arrayContaining([
          {_id: newAuthor1._id, name: newAuthor1.name},
          {_id: newAuthor2._id, name: newAuthor2.name},
        ]),
      );
    });
  });
});
