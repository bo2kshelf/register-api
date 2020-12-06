import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {BooksResolver} from '../../books.resolver';
import {BooksService} from '../../books.service';
import {Book, BookSchema} from '../../schema/book.schema';

describe('BookResolver', () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let bookModel: Model<Book>;

  let bookService: BooksService;
  let bookResolver: BooksResolver;

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
          useValue: {
            getById() {},
            id: (book: Book) => book._id,
            create() {},
          },
        },
        BooksResolver,
      ],
    }).compile();

    bookModel = module.get<Model<Book>>(getModelToken(Book.name));

    bookService = module.get<BooksService>(BooksService);
    bookResolver = module.get<BooksResolver>(BooksResolver);
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
    expect(bookResolver).toBeDefined();
  });

  describe('book()', () => {
    it('存在するならばそれを返す', async () => {
      const newBook = await bookModel.create({
        title: 'よふかしのうた(1)',
        isbn: '978-4091294920',
      });

      jest.spyOn(bookService, 'getById').mockResolvedValueOnce(newBook);

      const actual = await bookResolver.book(newBook._id);

      expect(actual).toHaveProperty('title', 'よふかしのうた(1)');
      expect(actual).toHaveProperty('isbn', '978-4091294920');
    });

    it('存在しない場合はErrorを返す', async () => {
      jest
        .spyOn(bookService, 'getById')
        .mockRejectedValueOnce(
          new Error(
            `Book associated with ID "5fccac3585e5265603349e97" doesn't exist.`,
          ),
        );

      await expect(() =>
        bookResolver.book('5fccac3585e5265603349e97'),
      ).rejects.toThrow(
        `Book associated with ID "5fccac3585e5265603349e97" doesn't exist.`,
      );
    });
  });

  describe('id()', () => {
    it('適切なIDを返す', async () => {
      const newBook = await bookModel.create({title: 'よふかしのうた(1)'});

      const actual = await bookResolver.id(newBook);

      expect(actual).toBe(newBook._id);
    });
  });

  describe('createBook()', () => {
    it('全てのプロパティが存在する', async () => {
      const newBook = await bookModel.create({
        title: 'よふかしのうた(1)',
        isbn: '978-4091294920',
      });

      jest.spyOn(bookService, 'create').mockResolvedValueOnce(newBook);

      const actual = await bookResolver.createBook({
        title: 'よふかしのうた(1)',
        isbn: '978-4091294920',
      });

      expect(actual).toHaveProperty('title', 'よふかしのうた(1)');
      expect(actual).toHaveProperty('isbn', '978-4091294920');
    });

    it('ISBNが欠落', async () => {
      const newBook = await bookModel.create({
        title: 'よふかしのうた(1)',
      });

      jest.spyOn(bookService, 'create').mockResolvedValueOnce(newBook);

      const actual = await bookResolver.createBook({
        title: 'よふかしのうた(1)',
      });

      expect(actual).toHaveProperty('title', 'よふかしのうた(1)');
      expect(actual).toHaveProperty('isbn', undefined);
    });
  });
});
