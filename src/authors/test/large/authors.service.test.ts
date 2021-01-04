import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import * as Relay from 'graphql-relay';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {BookDocument, BookSchema} from '../../../books/schema/book.schema';
import {PaginateModule} from '../../../paginate/paginate.module';
import {PaginateService} from '../../../paginate/paginate.service';
import {AuthorsService} from '../../authors.service';
import {AuthorDocument, AuthorSchema} from '../../schema/author.schema';

describe(AuthorsService.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let authorModel: Model<AuthorDocument>;
  let booksModel: Model<BookDocument>;

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
});
