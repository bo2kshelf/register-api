import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {Author, AuthorSchema} from '../../../authors/schema/author.schema';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {BooksResolver} from '../../books.resolver';
import {BooksService} from '../../books.service';
import {Book, BookSchema} from '../../schema/book.schema';

describe(BooksResolver.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let bookModel: Model<Book>;
  let authorModel: Model<Author>;

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
        MongooseModule.forFeature([
          {name: Book.name, schema: BookSchema},
          {name: Author.name, schema: AuthorSchema},
        ]),
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
    authorModel = module.get<Model<Author>>(getModelToken(Author.name));

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
    let author: Author;

    beforeAll(async () => {
      author = await authorModel.create({name: 'コトヤマ'});
    });

    afterAll(async () => {
      await authorModel.deleteMany({});
    });

    it('存在するならばそれを返す', async () => {
      const newBook = await bookModel.create({
        title: 'よふかしのうた(1)',
        isbn: '978-4091294920',
        authors: [{id: author._id}],
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
          new NoDocumentForObjectIdError(
            Book.name,
            new ObjectId('5fccac3585e5265603349e97'),
          ),
        );

      await expect(() =>
        bookResolver.book(new ObjectId('5fccac3585e5265603349e97')),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });
  });

  describe('id()', () => {
    it('適切なIDを返す', async () => {
      const newBook = await bookModel.create({
        title: 'よふかしのうた(1)',
        authors: [],
      });

      const actual = await bookResolver.id(newBook);

      expect(actual).toBe(newBook._id);
    });
  });

  describe('createBook()', () => {
    let author: Author;

    beforeAll(async () => {
      author = await authorModel.create({name: 'コトヤマ'});
    });

    afterAll(async () => {
      await authorModel.deleteMany({});
    });

    it('全てのプロパティが存在する', async () => {
      const newBook = await bookModel.create({
        title: 'よふかしのうた(1)',
        isbn: '978-4091294920',
        authors: [{id: author._id, roles: ['原作']}],
      });

      jest.spyOn(bookService, 'create').mockResolvedValueOnce(newBook);

      const actual = await bookResolver.createBook({
        title: 'よふかしのうた(1)',
        isbn: '978-4091294920',
        authors: [{id: author._id, roles: ['原作']}],
      });

      expect(actual).toHaveProperty('title', 'よふかしのうた(1)');
      expect(actual).toHaveProperty('isbn', '978-4091294920');
      expect(actual).toHaveProperty('authors');
      expect(actual.authors).toHaveLength(1);
      expect(typeof actual.authors[0].id).not.toBe('string');
    });

    it('iSBNが欠落しても通る', async () => {
      const newBook = await bookModel.create({
        title: 'よふかしのうた(1)',
        authors: [{id: author._id}],
      });

      jest.spyOn(bookService, 'create').mockResolvedValueOnce(newBook);

      const actual = await bookResolver.createBook({
        title: 'よふかしのうた(1)',
        authors: [{id: author._id}],
      });

      expect(actual).toHaveProperty('title', 'よふかしのうた(1)');
      expect(actual).toHaveProperty('isbn', undefined);
    });
  });
});
