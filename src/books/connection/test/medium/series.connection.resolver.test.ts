import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {NoDocumentForObjectIdError} from '../../../../error/no-document-for-objectid.error';
import {BooksService} from '../../../books.service';
import {Book, BookSchema} from '../../../schema/book.schema';
import {SeriesBooksConnectionResolver} from '../../series.connection.resolver';

describe(SeriesBooksConnectionResolver.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let bookModel: Model<Book>;

  let booksService: BooksService;

  let connectionResolver: SeriesBooksConnectionResolver;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          useFactory: async () => ({uri: await mongoServer.getUri()}),
        }),
        MongooseModule.forFeature([{name: Book.name, schema: BookSchema}]),
      ],
      providers: [
        {
          provide: BooksService,
          useValue: {getById() {}},
        },
        SeriesBooksConnectionResolver,
      ],
    }).compile();

    bookModel = module.get<Model<Book>>(getModelToken(Book.name));

    booksService = module.get<BooksService>(BooksService);
    connectionResolver = module.get<SeriesBooksConnectionResolver>(
      SeriesBooksConnectionResolver,
    );
  });

  afterEach(async () => {
    jest.clearAllMocks();

    await bookModel.deleteMany({});
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
      const newAuthor = await bookModel.create({
        title: 'よふかしのうた(1)',
        authors: [],
      });

      jest.spyOn(booksService, 'getById').mockResolvedValueOnce(newAuthor);

      const actual = await connectionResolver.book({
        id: new ObjectId('5fccac3585e5265603349e97'),
        serial: 1,
      });

      expect(actual).toHaveProperty('title', 'よふかしのうた(1)');
      expect(actual).toHaveProperty('authors');
    });

    it('存在しない場合はError', async () => {
      jest
        .spyOn(booksService, 'getById')
        .mockRejectedValueOnce(
          new NoDocumentForObjectIdError(
            Book.name,
            new ObjectId('5fccac3585e5265603349e97'),
          ),
        );

      await expect(() =>
        connectionResolver.book({
          id: new ObjectId('5fccac3585e5265603349e97'),
          serial: 1,
        }),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });
  });
});
