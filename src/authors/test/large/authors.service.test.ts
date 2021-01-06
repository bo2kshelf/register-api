import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import * as Relay from 'graphql-relay';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {BookDocument, BookSchema} from '../../../books/schema/book.schema';
import {PaginateModule} from '../../../paginate/paginate.module';
import {PaginateService} from '../../../paginate/paginate.service';
import {
  SeriesDocument,
  SeriesSchema,
} from '../../../series/schema/series.schema';
import {AuthorsService} from '../../authors.service';
import {AuthorDocument, AuthorSchema} from '../../schema/author.schema';

describe(AuthorsService.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let authorModel: Model<AuthorDocument>;
  let booksModel: Model<BookDocument>;
  let seriesModel: Model<SeriesDocument>;

  let paginateService: PaginateService;

  let authorService: AuthorsService;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          useFactory: async () => ({
            uri: await mongoServer.getUri(),
          }),
        }),
        MongooseModule.forFeature([
          {name: AuthorDocument.name, schema: AuthorSchema},
          {name: BookDocument.name, schema: BookSchema},
          {name: SeriesDocument.name, schema: SeriesSchema},
        ]),
        PaginateModule,
      ],
      providers: [AuthorsService],
    }).compile();

    authorModel = module.get<Model<AuthorDocument>>(
      getModelToken(AuthorDocument.name),
    );
    booksModel = module.get<Model<BookDocument>>(
      getModelToken(BookDocument.name),
    );
    seriesModel = module.get<Model<SeriesDocument>>(
      getModelToken(SeriesDocument.name),
    );

    paginateService = module.get<PaginateService>(PaginateService);

    authorService = module.get<AuthorsService>(AuthorsService);
  });

  afterEach(async () => {
    jest.clearAllMocks();

    await authorModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoServer.stop();

    await module.close();
  });

  it('should be defined', () => {
    expect(authorService).toBeDefined();
  });

  describe('books()', () => {
    let author: AuthorDocument;
    beforeEach(async () => {
      author = await authorModel.create({name: 'Name'});
    });

    it('正常に取得', async () => {
      await booksModel.create(
        [...new Array(20)].map((_, i) => ({
          title: `Book ${i + 1}`,
          authors: [{id: author._id}],
        })),
      );

      const actual = await authorService.books(author, {first: 10});

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

  describe('relatedSeries()', () => {
    let author: AuthorDocument;
    let book1: BookDocument;
    let book2: BookDocument;
    let book3: BookDocument;
    let book4: BookDocument;
    beforeEach(async () => {
      author = await authorModel.create({name: 'Name'});
      book1 = await booksModel.create({
        title: `Book 1`,
        authors: [{id: author._id}],
      });
      book2 = await booksModel.create({
        title: `Book 2`,
        authors: [{id: author._id}],
      });
      book3 = await booksModel.create({
        title: `Book 3`,
        authors: [{id: author._id}],
      });
      book4 = await booksModel.create({
        title: `Book 4`,
        authors: [{id: author._id}],
      });
    });

    it('Series.booksとSeries.relatedBooksから取得', async () => {
      await seriesModel.create({
        title: 'Series 1',
        books: [
          {id: book1._id, serial: 1},
          {id: book2._id, serial: 2},
        ],
        relatedBooks: [],
      });
      await seriesModel.create({
        title: 'Series 1',
        books: [],
        relatedBooks: [{id: book1._id}, {id: book2._id}],
      });

      const actual = await authorService.relatedSeries(author, {
        first: 10,
        include: {books: true, relatedBooks: true},
      });

      expect(actual).toBeDefined();

      expect(actual).toHaveProperty('aggregate');
      expect(actual.aggregate).toHaveProperty('count', 2);

      expect(actual).toHaveProperty('pageInfo');
      expect(actual.pageInfo).toHaveProperty(
        'startCursor',
        Relay.offsetToCursor(0),
      );
      expect(actual.pageInfo).toHaveProperty(
        'endCursor',
        Relay.offsetToCursor(1),
      );
      expect(actual.pageInfo).toHaveProperty('hasPreviousPage', false);
      expect(actual.pageInfo).toHaveProperty('hasNextPage', false);

      expect(actual).toHaveProperty('edges');
      expect(actual.edges).toHaveLength(2);
    });

    it('Series.booksのみから取得', async () => {
      await seriesModel.create({
        title: 'Series 1',
        books: [
          {id: book1._id, serial: 1},
          {id: book2._id, serial: 2},
        ],
        relatedBooks: [],
      });
      await seriesModel.create({
        title: 'Series 1',
        books: [],
        relatedBooks: [{id: book1._id}, {id: book2._id}],
      });

      const actual = await authorService.relatedSeries(author, {
        first: 10,
        include: {books: true, relatedBooks: false},
      });

      expect(actual).toBeDefined();

      expect(actual).toHaveProperty('aggregate');
      expect(actual.aggregate).toHaveProperty('count', 1);

      expect(actual).toHaveProperty('pageInfo');
      expect(actual.pageInfo).toHaveProperty(
        'startCursor',
        Relay.offsetToCursor(0),
      );
      expect(actual.pageInfo).toHaveProperty(
        'endCursor',
        Relay.offsetToCursor(0),
      );
      expect(actual.pageInfo).toHaveProperty('hasPreviousPage', false);
      expect(actual.pageInfo).toHaveProperty('hasNextPage', false);

      expect(actual).toHaveProperty('edges');
      expect(actual.edges).toHaveLength(1);
    });
  });
});
