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

describe(BooksService.name, () => {
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
    await authorModel.deleteMany({});
  });

  afterAll(async () => {
    await module.close();

    await mongoServer.stop();
  });

  it('should be defined', () => {
    expect(bookService).toBeDefined();
  });

  describe('id()', () => {
    it('ObjectIDを取得', async () => {
      const expected = new ObjectId();
      const newBook = await bookModel.create({
        _id: expected,
        title: 'Title',
        authors: [],
      });
      const actual = bookService.id(newBook);

      expect(actual).toBe(expected);
    });
  });

  describe('getById()', () => {
    let book: Book;
    let bookId: ObjectId;
    beforeEach(async () => {
      book = await bookModel.create({title: 'Title', authors: []});
      bookId = book._id;
    });

    it('存在する場合はそれを返す', async () => {
      const actual = await bookService.getById(bookId);

      expect(actual).toBeDefined();
      expect(actual).toHaveProperty('_id', bookId);
      expect(actual).toHaveProperty('title', book.title);
    });

    it('存在しない場合は例外を投げる', async () => {
      await book.remove();
      await expect(() => bookService.getById(bookId)).rejects.toThrow(
        NoDocumentForObjectIdError,
      );
    });
  });

  describe('all()', () => {
    it('何もなければ空配列を返す', async () => {
      const actual = await bookService.all();

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(0);
    });

    it('存在するならば配列を返す', async () => {
      for (let i = 0; i < 5; i++)
        await bookModel.create({title: 'Title', authors: []});

      const actual = await bookService.all();

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(5);
    });
  });

  describe('create()', () => {
    let author1: Author;
    let author2: Author;
    beforeEach(async () => {
      author1 = await authorModel.create({name: 'Name 1'});
      author2 = await authorModel.create({name: 'Name 2'});
    });

    it('authorsが空配列ならば例外を投げる', async () => {
      await expect(() =>
        bookService.create({
          title: 'Title',
          authors: [],
        }),
      ).rejects.toThrow(EmptyArrayError);
    });

    it('authors.idに重複があるならば例外を投げる', async () => {
      const dupl = new ObjectId();
      await expect(() =>
        bookService.create({
          title: 'Title',
          authors: [{id: dupl}, {id: dupl}],
        }),
      ).rejects.toThrow(DuplicateValueInArrayError);
    });

    it('該当するAuthorが一つでも存在しなければ例外を投げる', async () => {
      await author1.remove();
      await expect(() =>
        bookService.create({
          title: 'Title',
          authors: [{id: author1._id}, {id: author2._id}],
        }),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    describe('正常に生成する', () => {
      it('全てのプロパティが不足なくある', async () => {
        const actual = await bookService.create({
          title: 'Title',
          isbn: '9784091294920',
          authors: [
            {id: author1._id, roles: ['Original']},
            {id: author2._id, roles: ['Illust']},
          ],
        });
        expect(actual).toBeDefined();
        expect(actual).toHaveProperty('title', 'Title');
        expect(actual).toHaveProperty('isbn', '9784091294920');
        expect(actual).toHaveProperty('authors');
      });

      it('ISBNが存在しない', async () => {
        const actual = await bookService.create({
          title: 'Title',
          authors: [
            {id: author1._id, roles: ['Original']},
            {id: author2._id, roles: ['Illust']},
          ],
        });
        expect(actual).toBeDefined();
        expect(actual.isbn).toBeUndefined();
      });

      it('authors.rolesが存在しない', async () => {
        const actual = await bookService.create({
          title: 'Title',
          authors: [{id: author1._id}, {id: author2._id}],
        });
        expect(actual).toBeDefined();
        expect(actual).toHaveProperty('authors');
        expect(actual.authors[0].roles).toBeUndefined();
        expect(actual.authors[1].roles).toBeUndefined();
      });
    });
  });
});
