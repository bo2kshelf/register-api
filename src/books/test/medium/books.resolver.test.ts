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

  let booksService: BooksService;
  let booksResolver: BooksResolver;

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
      providers: [BooksService, BooksResolver],
    }).compile();

    bookModel = module.get<Model<Book>>(getModelToken(Book.name));
    authorModel = module.get<Model<Author>>(getModelToken(Author.name));

    booksService = module.get<BooksService>(BooksService);
    booksResolver = module.get<BooksResolver>(BooksResolver);
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
    expect(booksResolver).toBeDefined();
  });

  describe('book()', () => {
    let book: Book;
    let bookId: ObjectId;
    beforeEach(async () => {
      book = await bookModel.create({title: 'Title', authors: []});
      bookId = book._id;
    });

    it('存在するならばそれを返す', async () => {
      const actual = await booksResolver.book(bookId.toHexString());

      expect(actual).toBeDefined();
      expect(actual).toHaveProperty('_id', bookId);
      expect(actual).toHaveProperty('title', book.title);
    });

    it('存在しない場合は例外を投げる', async () => {
      await book.remove();
      await expect(() =>
        booksResolver.book(bookId.toHexString()),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('ObjectIdとして不正な値を入力すると例外発生', async () => {
      await expect(() =>
        booksResolver.book('Invalid ObjectId'),
      ).rejects.toThrow(Error);
    });
  });

  describe('allBooks()', () => {
    it('何もなければ空配列を返す', async () => {
      const actual = await booksResolver.allBooks();

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(0);
    });

    it('存在するならば配列を返す', async () => {
      for (let i = 0; i < 5; i++)
        await bookModel.create({title: 'Title', authors: []});

      const actual = await booksResolver.allBooks();

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(5);
    });
  });

  describe('id()', () => {
    it('StringとしてIDを取得', async () => {
      const newBooks = await bookModel.create({
        title: 'Title',
        authors: [],
      });
      const expected = newBooks._id.toHexString();
      const actual = booksResolver.id(newBooks);

      expect(actual).toBe(expected);
    });
  });

  describe('authors()', () => {
    it('Authorsを取得', async () => {
      const author1 = await authorModel.create({name: 'Name 1'});
      const author2 = await authorModel.create({name: 'Name 2'});
      const newBooks = await bookModel.create({
        title: 'Title',
        authors: [
          {id: author1._id, roles: ['Original']},
          {id: author2._id, roles: ['Illust']},
        ],
      });
      const actual = booksResolver.authors(newBooks);

      expect(actual).toBeDefined();
      expect(actual).toContainEqual({id: author1._id, roles: ['Original']});
      expect(actual).toContainEqual({id: author2._id, roles: ['Illust']});
    });
  });

  describe('createBook()', () => {
    let author1: Author;
    let author2: Author;
    beforeEach(async () => {
      author1 = await authorModel.create({name: 'Name 1'});
      author2 = await authorModel.create({name: 'Name 2'});
    });

    it('Serviceが正常に実行できたらそれを返す', async () => {
      const actual = await booksResolver.createBook({
        title: 'Title',
        authors: [
          {id: author1._id.toHexString(), roles: ['Original']},
          {id: author2._id.toHexString(), roles: ['Illust']},
        ],
      });
      expect(actual).toBeDefined();
    });

    it('ObjectIdとして不正な値を入力すると例外発生', async () => {
      await expect(() =>
        booksResolver.createBook({
          title: 'Title',
          authors: [{id: 'Invalid ObjectId'}],
        }),
      ).rejects.toThrow(Error);
    });
  });
});
