import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {Author, AuthorSchema} from '../../../authors/schema/author.schema';
import {Book, BookSchema} from '../../../books/schema/book.schema';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {
  PaginateService,
  RelayConnection,
} from '../../../paginate/paginate.service';
import {SeriesBooksArgs} from '../../dto/books.args';
import {Series, SeriesSchema} from '../../schema/series.schema';
import {SeriesResolver} from '../../series.resolver';
import {SeriesService} from '../../series.service';

jest.mock('../../../paginate/paginate.service');

describe(SeriesResolver.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let seriesModel: Model<Series>;
  let bookModel: Model<Book>;
  let authorsModel: Model<Author>;

  let paginateService: PaginateService;
  let seriesService: SeriesService;
  let seriesResolver: SeriesResolver;

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
          {name: Series.name, schema: SeriesSchema},
          {name: Book.name, schema: BookSchema},
          {name: Author.name, schema: AuthorSchema},
        ]),
      ],
      providers: [PaginateService, SeriesService, SeriesResolver],
    }).compile();

    seriesModel = module.get<Model<Series>>(getModelToken(Series.name));
    bookModel = module.get<Model<Book>>(getModelToken(Book.name));
    authorsModel = module.get<Model<Author>>(getModelToken(Author.name));

    paginateService = module.get<PaginateService>(PaginateService);
    seriesService = module.get<SeriesService>(SeriesService);
    seriesResolver = module.get<SeriesResolver>(SeriesResolver);
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
    expect(seriesResolver).toBeDefined();
  });

  describe('series()', () => {
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

    it('存在するならばそれを返す', async () => {
      const actual = await seriesResolver.series(seriesId.toHexString());

      expect(actual).toBeDefined();
      expect(actual).toHaveProperty('_id', seriesId);
      expect(actual).toHaveProperty('title', series.title);
    });

    it('存在しない場合は例外を投げる', async () => {
      await series.remove();
      await expect(() =>
        seriesResolver.series(seriesId.toHexString()),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('ObjectIdとして不正な値を入力すると例外発生', async () => {
      await expect(() =>
        seriesResolver.series('Invalid ObjectId'),
      ).rejects.toThrow(Error);
    });
  });

  describe('allSeries()', () => {
    it('何もなければ空配列を返す', async () => {
      const actual = await seriesResolver.allSeries();

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(0);
    });

    it('存在するならば配列を返す', async () => {
      for (let i = 0; i < 5; i++)
        await seriesModel.create({
          title: 'Title',
          books: [],
          relatedBooks: [],
        });

      const actual = await seriesResolver.allSeries();

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(5);
    });
  });

  describe('id()', () => {
    it('StringとしてIDを取得', async () => {
      const newSeries = await seriesModel.create({
        title: 'Title',
        books: [],
        relatedBooks: [],
      });
      const expected = newSeries._id.toHexString();
      const actual = seriesResolver.id(newSeries);

      expect(actual).toBe(expected);
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

    it('正常に取得する', async () => {
      jest
        .spyOn(paginateService, 'getConnectionFromMongooseModel')
        .mockResolvedValueOnce(
          {} as RelayConnection<{id: ObjectId; serial: number}>,
        );

      const actual = await seriesResolver.books(series, {} as SeriesBooksArgs);
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

    it('正常に取得する', async () => {
      jest
        .spyOn(paginateService, 'getConnectionFromMongooseModel')
        .mockResolvedValueOnce(
          {} as RelayConnection<{id: ObjectId; serial: number}>,
        );

      const actual = await seriesResolver.relatedBooks(
        series,
        {} as SeriesBooksArgs,
      );
      expect(actual).toBeDefined();
    });
  });

  describe('relatedAuthors()', () => {
    let newAuthor1: Author;
    let newAuthor2: Author;
    let newAuthor3: Author;
    let newAuthor4: Author;

    beforeEach(async () => {
      newAuthor1 = await authorsModel.create({name: 'Author 1'});
      newAuthor2 = await authorsModel.create({name: 'Author 2'});
      newAuthor3 = await authorsModel.create({name: 'Author 3'});
      newAuthor4 = await authorsModel.create({name: 'Author 4'});
    });

    it('正常に取得', async () => {
      const newBook1 = await bookModel.create({
        title: `Book 1`,
        authors: [{id: newAuthor1._id}, {id: newAuthor2._id}],
      });
      const newBook2 = await bookModel.create({
        title: `Book 2`,
        authors: [{id: newAuthor1._id}, {id: newAuthor3._id}],
      });
      const newRelatedBook1 = await bookModel.create({
        title: `RelatedBook 1`,
        authors: [{id: newAuthor3._id}, {id: newAuthor4._id}],
      });
      const newRelatedBook2 = await bookModel.create({
        title: `RelatedBook 2`,
        authors: [{id: newAuthor3._id}, {id: newAuthor1._id}],
      });

      const newSeries = await seriesModel.create({
        title: 'Series 1',
        books: [
          {id: newBook1._id, serial: 1},
          {id: newBook2._id, serial: 1},
        ],
        relatedBooks: [{id: newRelatedBook1._id}, {id: newRelatedBook2._id}],
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
  });

  describe('createSeries()', () => {
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

    it('Serviceが正常に実行できたらそれを返す', async () => {
      const actual = await seriesResolver.createSeries({
        title: 'Title',
        books: [
          {id: book1._id.toHexString(), serial: 1},
          {id: book2._id.toHexString(), serial: 2},
        ],
        relatedBooks: [
          {id: book3._id.toHexString()},
          {id: book4._id.toHexString()},
        ],
      });
      expect(actual).toBeDefined();
    });

    it('ObjectIdとして不正な値を入力すると例外発生', async () => {
      await expect(() =>
        seriesResolver.createSeries({
          title: 'Title',
          books: [{id: 'Invalid ObjectId', serial: 1}],
          relatedBooks: [{id: book3._id.toHexString()}],
        }),
      ).rejects.toThrow(Error);

      await expect(() =>
        seriesResolver.createSeries({
          title: 'Title',
          books: [{id: book1._id, serial: 1}],
          relatedBooks: [{id: 'Invalid ObjectId'}],
        }),
      ).rejects.toThrow(Error);
    });
  });

  describe('addBookToSeriesBooks()', () => {
    let series: Series;
    let book1: Book;
    let book2: Book;
    let book3: Book;
    beforeEach(async () => {
      book1 = await bookModel.create({title: 'Book 1', authors: []});
      book2 = await bookModel.create({title: 'Book 2', authors: []});
      book3 = await bookModel.create({title: 'Book 3', authors: []});
      series = await seriesModel.create({
        title: 'Series',
        books: [
          {id: book1._id, serial: 1},
          {id: book2._id, serial: 2},
        ],
        relatedBooks: [],
      });
    });

    it('Serviceが正常に実行できたらそれを返す', async () => {
      const actual = await seriesResolver.addBookToSeriesBooks({
        seriesId: series._id.toHexString(),
        bookId: book3._id.toHexString(),
        serial: 3,
      });
      expect(actual).toBeDefined();
      expect(actual.books).toBeDefined();
      expect(actual.books).toContainEqual({
        id: book3._id,
        serial: 3,
      });
    });

    it('ObjectIdとして不正な値を入力すると例外発生', async () => {
      await expect(() =>
        seriesResolver.addBookToSeriesBooks({
          seriesId: 'Invalid ObjectId',
          bookId: book3._id.toHexString(),
          serial: 3,
        }),
      ).rejects.toThrow(Error);

      await expect(() =>
        seriesResolver.addBookToSeriesBooks({
          seriesId: series._id.toHexString(),
          bookId: 'Invalid ObjectId',
          serial: 3,
        }),
      ).rejects.toThrow(Error);
    });
  });

  describe('addBookToSeriesRelatedBooks()', () => {
    let series: Series;
    let book1: Book;
    let book2: Book;
    let book3: Book;
    beforeEach(async () => {
      book1 = await bookModel.create({title: 'Book 1', authors: []});
      book2 = await bookModel.create({title: 'Book 2', authors: []});
      book3 = await bookModel.create({title: 'Book 3', authors: []});
      series = await seriesModel.create({
        title: 'Series',
        books: [],
        relatedBooks: [{id: book1._id}, {id: book2._id}],
      });
    });

    it('Serviceが正常に実行できたらそれを返す', async () => {
      const actual = await seriesResolver.addBookToSeriesRelatedBooks({
        seriesId: series._id.toHexString(),
        bookId: book3._id.toHexString(),
      });
      expect(actual).toBeDefined();
      expect(actual.relatedBooks).toBeDefined();
      expect(actual.relatedBooks).toContainEqual({
        id: book3._id,
      });
    });

    it('ObjectIdとして不正な値を入力すると例外発生', async () => {
      await expect(() =>
        seriesResolver.addBookToSeriesRelatedBooks({
          seriesId: 'Invalid ObjectId',
          bookId: book3._id.toHexString(),
        }),
      ).rejects.toThrow(Error);

      await expect(() =>
        seriesResolver.addBookToSeriesRelatedBooks({
          seriesId: series._id.toHexString(),
          bookId: 'Invalid ObjectId',
        }),
      ).rejects.toThrow(Error);
    });
  });
});
