import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {Author, AuthorSchema} from '../../../../authors/schema/author.schema';
import {NoDocumentForObjectIdError} from '../../../../error/no-document-for-objectid.error';
import {BooksService} from '../../../books.service';
import {BookDocument, BookSchema} from '../../../schema/book.schema';
import {
  SeriesBooksConnectionResolver,
  SeriesRelatedBooksConnectionResolver,
} from '../../series-connection.resolver';

describe(SeriesBooksConnectionResolver.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let bookModel: Model<BookDocument>;

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
        MongooseModule.forFeature([
          {name: BookDocument.name, schema: BookSchema},
          {name: Author.name, schema: AuthorSchema},
        ]),
      ],
      providers: [BooksService, SeriesBooksConnectionResolver],
    }).compile();

    bookModel = module.get<Model<BookDocument>>(
      getModelToken(BookDocument.name),
    );

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

  describe('book()', () => {
    let book: BookDocument;
    let bookId: ObjectId;
    beforeEach(async () => {
      book = await bookModel.create({title: 'Title', authors: []});
      bookId = book._id;
    });

    it('存在するならばそれを返す', async () => {
      const actual = await connectionResolver.book({
        id: bookId,
        serial: 1,
      });

      expect(actual).toBeDefined();
      expect(actual).toHaveProperty('_id', bookId);
      expect(actual).toHaveProperty('title', book.title);
    });

    it('存在しない場合は例外を投げる', async () => {
      await book.remove();
      await expect(() =>
        connectionResolver.book({
          id: bookId,
          serial: 1,
        }),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });
  });
});

describe(SeriesRelatedBooksConnectionResolver.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let bookModel: Model<BookDocument>;

  let booksService: BooksService;

  let connectionResolver: SeriesRelatedBooksConnectionResolver;

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
          {name: Author.name, schema: AuthorSchema},
        ]),
      ],
      providers: [BooksService, SeriesRelatedBooksConnectionResolver],
    }).compile();

    bookModel = module.get<Model<BookDocument>>(
      getModelToken(BookDocument.name),
    );

    booksService = module.get<BooksService>(BooksService);
    connectionResolver = module.get<SeriesRelatedBooksConnectionResolver>(
      SeriesRelatedBooksConnectionResolver,
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

  describe('book()', () => {
    let book: BookDocument;
    let bookId: ObjectId;
    beforeEach(async () => {
      book = await bookModel.create({title: 'Title', authors: []});
      bookId = book._id;
    });

    it('存在するならばそれを返す', async () => {
      const actual = await connectionResolver.book({
        id: bookId,
        serial: 1,
      });

      expect(actual).toBeDefined();
      expect(actual).toHaveProperty('_id', bookId);
      expect(actual).toHaveProperty('title', book.title);
    });

    it('存在しない場合は例外を投げる', async () => {
      await book.remove();
      await expect(() =>
        connectionResolver.book({
          id: bookId,
          serial: 1,
        }),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });
  });
});
