import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {BookDocument, BookSchema} from '../../../../books/schema/book.schema';
import {NoDocumentForObjectIdError} from '../../../../error/no-document-for-objectid.error';
import {PaginateService} from '../../../../paginate/paginate.service';
import {
  SeriesDocument,
  SeriesSchema,
} from '../../../../series/schema/series.schema';
import {AuthorsService} from '../../../authors.service';
import {AuthorDocument, AuthorSchema} from '../../../schema/author.schema';
import {BookAuthorsConnectionResolver} from '../../book-connection.resolver';

jest.mock('../../../../paginate/paginate.service');

describe(BookAuthorsConnectionResolver.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let authorModel: Model<AuthorDocument>;

  let authorService: AuthorsService;

  let connectionResolver: BookAuthorsConnectionResolver;

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
      ],
      providers: [
        PaginateService,
        AuthorsService,
        BookAuthorsConnectionResolver,
      ],
    }).compile();

    authorModel = module.get<Model<AuthorDocument>>(
      getModelToken(AuthorDocument.name),
    );

    authorService = module.get<AuthorsService>(AuthorsService);
    connectionResolver = module.get<BookAuthorsConnectionResolver>(
      BookAuthorsConnectionResolver,
    );
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
    expect(connectionResolver).toBeDefined();
  });

  describe('author()', () => {
    let author: AuthorDocument;
    let authorId: ObjectId;
    beforeEach(async () => {
      author = await authorModel.create({name: 'Name'});
      authorId = author._id;
    });

    it('存在するならばそれを返す', async () => {
      const actual = await connectionResolver.author({
        id: authorId,
      });

      expect(actual).toBeDefined();
    });

    it('存在しない場合はErrorを返す', async () => {
      await author.remove();
      await expect(() =>
        connectionResolver.author({
          id: authorId,
        }),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });
  });
});
