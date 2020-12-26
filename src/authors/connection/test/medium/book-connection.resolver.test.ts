import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {NoDocumentForObjectIdError} from '../../../../error/no-document-for-objectid.error';
import {AuthorsService} from '../../../authors.service';
import {Author, AuthorSchema} from '../../../schema/author.schema';
import {BookAuthorsConnectionResolver} from '../../book-connection.resolver';

describe(BookAuthorsConnectionResolver.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let authorModel: Model<Author>;

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
        MongooseModule.forFeature([{name: Author.name, schema: AuthorSchema}]),
      ],
      providers: [
        {
          provide: AuthorsService,
          useValue: {getById() {}},
        },
        BookAuthorsConnectionResolver,
      ],
    }).compile();

    authorModel = module.get<Model<Author>>(getModelToken(Author.name));

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
    it('存在するならばそれを返す', async () => {
      const newAuthor = await authorModel.create({name: 'コトヤマ'});

      jest.spyOn(authorService, 'getById').mockResolvedValueOnce(newAuthor);

      const actual = await connectionResolver.author({
        id: new ObjectId('5fccac3585e5265603349e97'),
      });

      expect(actual).toHaveProperty('name', 'コトヤマ');
    });

    it('存在しない場合はError', async () => {
      jest
        .spyOn(authorService, 'getById')
        .mockRejectedValueOnce(
          new NoDocumentForObjectIdError(
            Author.name,
            new ObjectId('5fccac3585e5265603349e97'),
          ),
        );

      await expect(() =>
        connectionResolver.author({
          id: new ObjectId('5fccac3585e5265603349e97'),
        }),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });
  });
});
