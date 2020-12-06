import {HttpModule} from '@nestjs/common';
import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {BooksService} from '../../books.service';
import {Book, BookSchema} from '../../schema/book.schema';

describe('BookService', () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let bookModel: Model<Book>;

  let bookService: BooksService;

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
        HttpModule,
      ],
      providers: [BooksService],
    }).compile();

    bookModel = module.get<Model<Book>>(getModelToken(Book.name));

    bookService = module.get<BooksService>(BooksService);
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
    expect(bookService).toBeDefined();
  });

  describe('id()', () => {
    it('ObjectIDを取得', async () => {
      const newBook = await bookModel.create({title: 'Title'});

      const actual = bookService.id(newBook);

      expect(actual).toBe(newBook._id);
    });
  });

  describe('getById()', () => {
    it('存在する場合はそれを返す', async () => {
      const newBook = await bookModel.create({
        title: 'よふかしのうた(1)',
        isbn: '978-4091294920',
      });

      const actual = await bookService.getById(bookService.id(newBook));

      expect(actual).toHaveProperty('title', 'よふかしのうた(1)');
      expect(actual).toHaveProperty('isbn', '978-4091294920');
    });

    it('存在しない場合はError', async () => {
      await expect(() =>
        bookService.getById('5fccac3585e5265603349e97'),
      ).rejects.toThrow(
        `Book associated with ID "5fccac3585e5265603349e97" doesn't exist.`,
      );
    });
  });

  describe('create()', () => {
    it('全てのプロパティが存在する', async () => {
      const actual = await bookService.create({
        title: 'よふかしのうた(1)',
        isbn: '978-4091294920',
      });

      expect(actual).toHaveProperty('title', 'よふかしのうた(1)');
      expect(actual).toHaveProperty('isbn', '978-4091294920');
    });

    it('ISBNが欠落', async () => {
      const actual = await bookService.create({
        title: 'よふかしのうた(1)',
      });

      expect(actual).toHaveProperty('title', 'よふかしのうた(1)');
      expect(actual).toHaveProperty('isbn', undefined);
    });
  });
});
