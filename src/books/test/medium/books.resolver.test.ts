import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {
  AuthorDocument,
  AuthorSchema,
} from '../../../authors/schema/author.schema';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {
  SeriesDocument,
  SeriesSchema,
} from '../../../series/schema/series.schema';
import {BooksResolver} from '../../books.resolver';
import {BooksService} from '../../books.service';
import {BookDocument, BookSchema} from '../../schema/book.schema';

describe(BooksResolver.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let bookModel: Model<BookDocument>;
  let authorModel: Model<AuthorDocument>;
  let seriesModel: Model<SeriesDocument>;

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
          {name: BookDocument.name, schema: BookSchema},
          {name: AuthorDocument.name, schema: AuthorSchema},
          {name: SeriesDocument.name, schema: SeriesSchema},
        ]),
      ],
      providers: [BooksService, BooksResolver],
    }).compile();

    bookModel = module.get<Model<BookDocument>>(
      getModelToken(BookDocument.name),
    );
    authorModel = module.get<Model<AuthorDocument>>(
      getModelToken(AuthorDocument.name),
    );
    seriesModel = module.get<Model<SeriesDocument>>(
      getModelToken(SeriesDocument.name),
    );

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
    let book: BookDocument;
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

  describe('relatedSeries()', () => {
    it('正常に取得', async () => {
      const newAuthor = await authorModel.create({name: 'Author 1'});
      const newBook = await bookModel.create({
        title: `Book 1`,
        authors: [{id: newAuthor._id}],
      });
      const newSeries1 = await seriesModel.create({
        title: 'Series 1',
        books: [{id: newBook._id, serial: 1}],
        relatedBooks: [],
      });
      const newSeries2 = await seriesModel.create({
        title: 'Series 2',
        books: [],
        relatedBooks: [{id: newBook._id}],
      });
      await seriesModel.create({
        title: 'Series unused',
        books: [],
        relatedBooks: [],
      });

      const actual = await booksResolver.relatedSeries(newBook);

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(2);
      expect(actual.map(({_id}) => _id)).toStrictEqual(
        expect.arrayContaining([newSeries1._id, newSeries2._id]),
      );
    });
  });

  describe('createBook()', () => {
    let author1: AuthorDocument;
    let author2: AuthorDocument;
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
