import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import * as Relay from 'graphql-relay';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {
  AuthorDocument,
  AuthorSchema,
} from '../../../authors/schema/author.schema';
import {BookDocument, BookSchema} from '../../../books/schema/book.schema';
import {OrderDirection} from '../../../paginate/enum/order-direction.enum';
import {PaginateModule} from '../../../paginate/paginate.module';
import {SeriesDocument, SeriesSchema} from '../../schema/series.schema';
import {SeriesService} from '../../series.service';

describe(SeriesService.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let authorModel: Model<AuthorDocument>;
  let bookModel: Model<BookDocument>;
  let seriesModel: Model<SeriesDocument>;

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
          {name: AuthorDocument.name, schema: AuthorSchema},
          {name: BookDocument.name, schema: BookSchema},
          {name: SeriesDocument.name, schema: SeriesSchema},
        ]),
        PaginateModule,
      ],
      providers: [SeriesService],
    }).compile();

    authorModel = module.get<Model<AuthorDocument>>(
      getModelToken(AuthorDocument.name),
    );
    bookModel = module.get<Model<BookDocument>>(
      getModelToken(BookDocument.name),
    );
    seriesModel = module.get<Model<SeriesDocument>>(
      getModelToken(SeriesDocument.name),
    );

    seriesService = module.get<SeriesService>(SeriesService);
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
    expect(seriesService).toBeDefined();
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

      const actual = await seriesService.books(
        newSeries,
        {first: 10},
        {serial: OrderDirection.ASC},
      );
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

      const actual = await seriesService.books(
        newSeries,
        {first: 10},
        {serial: OrderDirection.DESC},
      );
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

      const actual = await seriesService.relatedBooks(newSeries, {first: 10});
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
