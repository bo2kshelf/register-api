import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {Book, BookSchema} from '../../../books/schema/book.schema';
import {MongooseNotExistError} from '../../../error/mongoose-not-exist.error';
import {Series, SeriesSchema} from '../../schema/series.schema';
import {SeriesResolver} from '../../series.resolver';
import {SeriesService} from '../../series.service';

describe('SeriesResolver', () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let seriesModel: Model<Series>;
  let bookModel: Model<Book>;

  let seriesService: SeriesService;
  let seriesResolver: SeriesResolver;

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
          {name: Series.name, schema: SeriesSchema},
          {name: Book.name, schema: BookSchema},
        ]),
      ],
      providers: [
        {
          provide: SeriesService,
          useValue: {
            getById() {},
            id: (series: Series) => series._id,
            create() {},
          },
        },
        SeriesResolver,
      ],
    }).compile();

    seriesModel = module.get<Model<Series>>(getModelToken(Series.name));
    bookModel = module.get<Model<Book>>(getModelToken(Book.name));

    seriesService = module.get<SeriesService>(SeriesService);
    seriesResolver = module.get<SeriesResolver>(SeriesResolver);
  });

  afterEach(async () => {
    jest.clearAllMocks();

    await seriesModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoServer.stop();

    await module.close();
  });

  it('should be defined', () => {
    expect(seriesResolver).toBeDefined();
  });

  describe('Series()', () => {
    let book: Book;

    beforeAll(async () => {
      book = await bookModel.create({
        title: 'よふかしのうた(1)',
        authors: [],
      });
    });

    afterAll(async () => {
      await bookModel.deleteMany({});
    });

    it('存在するならばそれを返す', async () => {
      const newSeries = await seriesModel.create({
        title: 'よふかしのうた',
        books: [{id: book._id, serial: 1}],
        relatedBooks: [],
      });

      jest.spyOn(seriesService, 'getById').mockResolvedValueOnce(newSeries);

      const actual = await seriesResolver.series(newSeries._id);

      expect(actual).toHaveProperty('title', 'よふかしのうた');
    });

    it('存在しない場合はErrorを返す', async () => {
      jest
        .spyOn(seriesService, 'getById')
        .mockRejectedValueOnce(
          new MongooseNotExistError(
            Series.name,
            'id',
            '5fccac3585e5265603349e97',
          ),
        );

      await expect(() =>
        seriesResolver.series(new ObjectId('5fccac3585e5265603349e97')),
      ).rejects.toThrow(MongooseNotExistError);
    });
  });

  describe('id()', () => {
    it('適切なIDを返す', async () => {
      const newSeries = await seriesModel.create({
        title: 'よふかしのうた',
        books: [],
        relatedBooks: [],
      });

      const actual = await seriesResolver.id(newSeries);

      expect(actual).toBe(newSeries._id);
    });
  });

  describe('createSeries()', () => {
    let book: Book;

    beforeAll(async () => {
      book = await bookModel.create({
        title: 'よふかしのうた(1)',
        authors: [],
      });
    });

    afterAll(async () => {
      await bookModel.deleteMany({});
    });

    it('全てのプロパティが存在する', async () => {
      const newSeries = await seriesModel.create({
        title: 'よふかしのうた',
        books: [{id: book._id, serial: 1}],
        relatedBooks: [book._id],
      });

      jest.spyOn(seriesService, 'create').mockResolvedValueOnce(newSeries);

      const actual = await seriesResolver.createSeries({
        title: 'よふかしのうた',
        books: [{id: book._id, serial: 1}],
        relatedBooks: [book._id],
      });

      expect(actual).toHaveProperty('title', 'よふかしのうた');
      expect(actual).toHaveProperty('relatedBooks');
    });

    it('relatedBooksが欠落していても通る', async () => {
      const newSeries = await seriesModel.create({
        title: 'よふかしのうた',
        books: [{id: book._id, serial: 1}],
        relatedBooks: [],
      });

      jest.spyOn(seriesService, 'create').mockResolvedValueOnce(newSeries);

      const actual = await seriesResolver.createSeries({
        title: 'よふかしのうた',
        books: [{id: book._id, serial: 1}],
      });

      expect(actual).toHaveProperty('title', 'よふかしのうた');
      expect(actual).toHaveProperty('relatedBooks');
    });
  });
});
