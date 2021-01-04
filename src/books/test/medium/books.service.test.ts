import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {AuthorDocument, AuthorSchema} from '../../../authors/schema/author.schema';
import {DuplicateValueInArrayError} from '../../../error/duplicate-values-in-array.error';
import {EmptyArrayError} from '../../../error/empty-array.error';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {Series, SeriesSchema} from '../../../series/schema/series.schema';
import {BooksService} from '../../books.service';
import {BookDocument, BookSchema} from '../../schema/book.schema';

describe(BooksService.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let bookModel: Model<BookDocument>;
  let authorModel: Model<AuthorDocument>;
  let seriesModel: Model<Series>;

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
          {name: BookDocument.name, schema: BookSchema},
          {name: AuthorDocument.name, schema: AuthorSchema},
          {name: Series.name, schema: SeriesSchema},
        ]),
      ],
      providers: [BooksService],
    }).compile();

    bookModel = module.get<Model<BookDocument>>(getModelToken(BookDocument.name));
    authorModel = module.get<Model<AuthorDocument>>(getModelToken(AuthorDocument.name));
    seriesModel = module.get<Model<Series>>(getModelToken(Series.name));

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
    beforeEachBookDocumentnc () => {
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
    let author1: AuthorDocument;
    let author2: AuthorDocument;
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

  describe('relatedSeries()', () => {
    it('Series.booksの中に', async () => {
      const newAuthor = await authorModel.create({name: 'Author 1'});
      const newBook = await bookModel.create({
        title: `Book 1`,
        authors: [{id: newAuthor._id}],
      });
      const newSeries = await seriesModel.create({
        title: 'Series 1',
        books: [{id: newBook._id, serial: 1}],
        relatedBooks: [],
      });
      await seriesModel.create({
        title: 'Series unused',
        books: [],
        relatedBooks: [],
      });

      const actual = await bookService.relatedSeries(newBook);

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(1);
      expect(actual[0]._id).toStrictEqual(newSeries._id);
    });

    it('Series.relatedBooksの中に', async () => {
      const newAuthor = await authorModel.create({name: 'Author 1'});
      const newBook = await bookModel.create({
        title: `Book 1`,
        authors: [{id: newAuthor._id}],
      });
      const newSeries = await seriesModel.create({
        title: 'Series 1',
        books: [],
        relatedBooks: [{id: newBook._id}],
      });
      await seriesModel.create({
        title: 'Series unused',
        books: [],
        relatedBooks: [],
      });

      const actual = await bookService.relatedSeries(newBook);

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(1);
      expect(actual[0]._id).toStrictEqual(newSeries._id);
    });

    it('複数のSeriesにまたがる場合', async () => {
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

      const actual = await bookService.relatedSeries(newBook);

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(2);
      expect(actual.map(({_id}) => _id)).toStrictEqual(
        expect.arrayContaining([newSeries1._id, newSeries2._id]),
      );
    });
  });
});
