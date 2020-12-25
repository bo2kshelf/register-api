import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {Author, AuthorSchema} from '../../../authors/schema/author.schema';
import {DuplicateValueInArrayError} from '../../../error/duplicate-values-in-array.error';
import {EmptyArrayError} from '../../../error/empty-array.error';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {BooksService} from '../../books.service';
import {Book, BookSchema} from '../../schema/book.schema';

describe('BookService', () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let bookModel: Model<Book>;
  let authorModel: Model<Author>;

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
        MongooseModule.forFeature([
          {name: Book.name, schema: BookSchema},
          {name: Author.name, schema: AuthorSchema},
        ]),
      ],
      providers: [BooksService],
    }).compile();

    bookModel = module.get<Model<Book>>(getModelToken(Book.name));
    authorModel = module.get<Model<Author>>(getModelToken(Author.name));

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
    it('objectIDを取得', async () => {
      const newBook = await bookModel.create({title: 'Title', authors: []});

      const actual = bookService.id(newBook);

      expect(actual).toBe(newBook._id);
    });
  });

  describe('getById()', () => {
    let author: Author;

    beforeAll(async () => {
      author = await authorModel.create({name: 'コトヤマ'});
    });

    afterAll(async () => {
      await authorModel.deleteMany({});
    });

    it('存在する場合はそれを返す', async () => {
      const newBook = await bookModel.create({
        title: 'よふかしのうた(1)',
        isbn: '978-4091294920',
        authors: [{id: author._id}],
      });

      const actual = await bookService.getById(bookService.id(newBook));

      expect(actual).toHaveProperty('title', 'よふかしのうた(1)');
      expect(actual).toHaveProperty('isbn', '978-4091294920');
      expect(actual).toHaveProperty('authors');
    });

    it('存在しない場合はError', async () => {
      await expect(() =>
        bookService.getById(new ObjectId('5fccac3585e5265603349e97')),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });
  });

  describe('create()', () => {
    let author: Author;

    beforeEach(async () => {
      author = await authorModel.create({name: 'コトヤマ'});
    });

    afterEach(async () => {
      await authorModel.deleteMany({});
    });

    it('全てのプロパティがある', async () => {
      const actual = await bookService.create({
        title: 'よふかしのうた(1)',
        isbn: '978-4091294920',
        authors: [{id: author._id, roles: ['原作']}],
      });

      expect(actual).toHaveProperty('title', 'よふかしのうた(1)');
      expect(actual).toHaveProperty('isbn', '978-4091294920');
      expect(actual).toHaveProperty('authors');
    });

    it('ISBNが欠落していても通る', async () => {
      const actual = await bookService.create({
        title: 'よふかしのうた(1)',
        authors: [{id: author._id}],
      });

      expect(actual).toHaveProperty('title', 'よふかしのうた(1)');
      expect(actual).toHaveProperty('isbn', undefined);
      expect(actual).toHaveProperty('authors');
    });

    it('authorsのrolesは無くても通る', async () => {
      const actual = await bookService.create({
        title: 'よふかしのうた(1)',
        isbn: '978-4091294920',
        authors: [{id: author._id}],
      });

      expect(actual).toHaveProperty('title', 'よふかしのうた(1)');
      expect(actual).toHaveProperty('isbn', '978-4091294920');
      expect(actual).toHaveProperty('authors');
    });

    it('authorsが重複している場合はError', async () => {
      await expect(() =>
        bookService.create({
          title: 'よふかしのうた(1)',
          authors: [{id: author._id}, {id: author._id}],
        }),
      ).rejects.toThrow(DuplicateValueInArrayError);
    });

    it('authorsが空の場合はError', async () => {
      await expect(() =>
        bookService.create({
          title: 'よふかしのうた(1)',
          authors: [],
        }),
      ).rejects.toThrow(EmptyArrayError);
    });

    it('idに結びついたauthorが存在しない場合はError', async () => {
      await authorModel.deleteMany({});

      await expect(() =>
        bookService.create({
          title: 'よふかしのうた(1)',
          authors: [{id: author._id}],
        }),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });
  });
});
