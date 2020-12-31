import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import * as Relay from 'graphql-relay';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {Author, AuthorSchema} from '../../../authors/schema/author.schema';
import {Book, BookSchema} from '../../../books/schema/book.schema';
import {OrderDirection} from '../../../paginate/enum/order-direction.enum';
import {PaginateModule} from '../../../paginate/paginate.module';
import {Series, SeriesSchema} from '../../schema/series.schema';
import {SeriesResolver} from '../../series.resolver';
import {SeriesService} from '../../series.service';

describe(SeriesResolver.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let authorModel: Model<Author>;
  let bookModel: Model<Book>;
  let seriesModel: Model<Series>;

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
          {name: Author.name, schema: AuthorSchema},
          {name: Book.name, schema: BookSchema},
          {name: Series.name, schema: SeriesSchema},
        ]),
        PaginateModule,
      ],
      providers: [SeriesService, SeriesResolver],
    }).compile();

    authorModel = module.get<Model<Author>>(getModelToken(Author.name));
    bookModel = module.get<Model<Book>>(getModelToken(Book.name));
    seriesModel = module.get<Model<Series>>(getModelToken(Series.name));

    seriesResolver = module.get<SeriesResolver>(SeriesResolver);
  });

  afterEach(async () => {
    jest.clearAllMocks();

    await authorModel.deleteMany({});
    await seriesModel.deleteMany({});
    await bookModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoServer.stop();

    await module.close();
  });

  it('should be defined', () => {
    expect(seriesResolver).toBeDefined();
  });

  describe('books()', () => {
    it('serialで昇順に取得', async () => {
      const newAuthor = await authorModel.create({name: 'Author 1'});
      const newBooks = await bookModel.create(
        [...new Array(20)].map((_, i) => ({
          title: `Book ${i + 1}`,
          authors: [{id: newAuthor._id}],
        })),
      );
      const newSeries = await seriesModel.create({
        title: 'Series 1',
        books: newBooks.map((book, i) => ({id: book._id, serial: i + 1})),
        relatedBooks: [],
      });

      const actual = await seriesResolver.books(newSeries, {
        first: 10,
        orderBy: {serial: OrderDirection.ASC},
      });
      expect(actual).toBeDefined();

      expect(actual).toHaveProperty('aggregate');
      expect(actual.aggregate).toHaveProperty('count', 20);

      expect(actual).toHaveProperty('pageInfo');
      expect(actual.pageInfo).toHaveProperty(
        'startCursor',
        Relay.offsetToCursor(0),
      );
      expect(actual.pageInfo).toHaveProperty(
        'endCursor',
        Relay.offsetToCursor(9),
      );
      expect(actual.pageInfo).toHaveProperty('hasPreviousPage', false);
      expect(actual.pageInfo).toHaveProperty('hasNextPage', true);

      expect(actual).toHaveProperty('edges');
      expect(actual.edges).toHaveLength(10);
      for (let i = 0; i < 10; i++)
        expect(actual.edges[i].node.serial).toBe(i + 1);
    });

    it('serialで降順に取得', async () => {
      const newAuthor = await authorModel.create({name: 'Author 1'});
      const newBooks = await bookModel.create(
        [...new Array(20)].map((_, i) => ({
          title: `Book ${i + 1}`,
          authors: [{id: newAuthor._id}],
        })),
      );
      const newSeries = await seriesModel.create({
        title: 'Series 1',
        books: newBooks.map((book, i) => ({id: book._id, serial: i + 1})),
        relatedBooks: [],
      });

      const actual = await seriesResolver.books(newSeries, {
        first: 10,
        orderBy: {
          serial: OrderDirection.DESC,
        },
      });
      expect(actual).toBeDefined();

      expect(actual).toHaveProperty('aggregate');
      expect(actual.aggregate).toHaveProperty('count', 20);

      expect(actual).toHaveProperty('pageInfo');
      expect(actual.pageInfo).toHaveProperty(
        'startCursor',
        Relay.offsetToCursor(0),
      );
      expect(actual.pageInfo).toHaveProperty(
        'endCursor',
        Relay.offsetToCursor(9),
      );
      expect(actual.pageInfo).toHaveProperty('hasPreviousPage', false);
      expect(actual.pageInfo).toHaveProperty('hasNextPage', true);

      expect(actual).toHaveProperty('edges');
      expect(actual.edges).toHaveLength(10);
      for (let i = 0; i < 10; i++)
        expect(actual.edges[i].node.serial).toBe(20 - i);
    });
  });

  describe('relatedBooks()', () => {
    it('取得', async () => {
      const newAuthor = await authorModel.create({name: 'Author 1'});
      const newBooks = await bookModel.create(
        [...new Array(20)].map((_, i) => ({
          title: `Book ${i + 1}`,
          authors: [{id: newAuthor._id}],
        })),
      );
      const newSeries = await seriesModel.create({
        title: 'Series 1',
        books: [],
        relatedBooks: newBooks.map((book, i) => ({id: book._id})),
      });

      const actual = await seriesResolver.relatedBooks(newSeries, {first: 10});
      expect(actual).toBeDefined();

      expect(actual).toHaveProperty('aggregate');
      expect(actual.aggregate).toHaveProperty('count', 20);

      expect(actual).toHaveProperty('pageInfo');
      expect(actual.pageInfo).toHaveProperty(
        'startCursor',
        Relay.offsetToCursor(0),
      );
      expect(actual.pageInfo).toHaveProperty(
        'endCursor',
        Relay.offsetToCursor(9),
      );
      expect(actual.pageInfo).toHaveProperty('hasPreviousPage', false);
      expect(actual.pageInfo).toHaveProperty('hasNextPage', true);

      expect(actual).toHaveProperty('edges');
      expect(actual.edges).toHaveLength(10);
    });
  });
});
