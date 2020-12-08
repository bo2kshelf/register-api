import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {BooksService} from '../../../books.service';
import {Book, BookSchema} from '../../../schema/book.schema';
import {BookSeriesConnectionResolver} from '../../series.connection.resolver';

describe('BookSeriesConnectionResolver', () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let bookModel: Model<Book>;

  let booksService: BooksService;

  let connectionResolver: BookSeriesConnectionResolver;

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
        BookSeriesConnectionResolver,
      ],
    }).compile();

    bookModel = module.get<Model<Book>>(getModelToken(Book.name));

    booksService = module.get<BooksService>(BooksService);
    connectionResolver = module.get<BookSeriesConnectionResolver>(
      BookSeriesConnectionResolver,
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
        id: '5fccac3585e5265603349e97',
        serial: 1,
      });

      expect(actual).toHaveProperty('title', 'よふかしのうた(1)');
      expect(actual).toHaveProperty('authors');
    });

    it('存在しない場合はError', async () => {
      jest
        .spyOn(booksService, 'getById')
        .mockRejectedValueOnce(
          new Error(
            `Not exist Book document for "id:5fccac3585e5265603349e97"`,
          ),
        );

      await expect(() =>
        connectionResolver.book({id: '5fccac3585e5265603349e97', serial: 1}),
      ).rejects.toThrow(
        `Not exist Book document for "id:5fccac3585e5265603349e97"`,
      );
    });
  });
});
