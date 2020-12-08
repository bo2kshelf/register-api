import {HttpModule} from '@nestjs/common';
import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {Book, BookSchema} from '../../../books/schema/book.schema';
import {Series, SeriesSchema} from '../../schema/series.schema';
import {SeriesService} from '../../series.service';

describe('SeriesService', () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let bookModel: Model<Book>;
  let seriesModel: Model<Series>;

  let seriesService: SeriesService;

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
          {name: Series.name, schema: SeriesSchema},
        ]),
        HttpModule,
      ],
      providers: [SeriesService],
    }).compile();

    bookModel = module.get<Model<Book>>(getModelToken(Book.name));
    seriesModel = module.get<Model<Series>>(getModelToken(Series.name));

    seriesService = module.get<SeriesService>(SeriesService);
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
    expect(seriesService).toBeDefined();
  });

  describe('id()', () => {
    it('ObjectIDを取得', async () => {
      const newSeries = await seriesModel.create({
        title: 'よふかしのうた',
        relatedBooks: [],
      });

      const actual = seriesService.id(newSeries);

      expect(actual).toBe(newSeries._id);
    });
  });

  describe('getById()', () => {
    it('存在する場合はそれを返す', async () => {
      const newSeries = await seriesModel.create({
        title: 'よふかしのうた',
        relatedBooks: [],
      });

      const actual = await seriesService.getById(seriesService.id(newSeries));

      expect(actual).toHaveProperty('title', 'よふかしのうた');
    });

    it('存在しない場合はError', async () => {
      await expect(() =>
        seriesService.getById('5fccac3585e5265603349e97'),
      ).rejects.toThrow(
        `Series associated with ID "5fccac3585e5265603349e97" doesn't exist.`,
      );
    });
  });

  describe('create()', () => {
    let book: Book;

    beforeEach(async () => {
      book = await bookModel.create({
        title: 'よふかしのうた(1)',
        authors: [],
      });
    });

    afterEach(async () => {
      await bookModel.deleteMany({});
    });

    it('全てのプロパティが存在する', async () => {
      const actual = await seriesService.create({
        title: 'よふかしのうた',
        relatedBooks: [book._id],
      });

      expect(actual).toHaveProperty('title', 'よふかしのうた');
      expect(actual).toHaveProperty('relatedBooks');
    });

    it('relatedBooksが欠落しても通る', async () => {
      const actual = await seriesService.create({title: 'よふかしのうた'});

      expect(actual).toHaveProperty('title', 'よふかしのうた');
      expect(actual).toHaveProperty('relatedBooks');
    });

    it('relatedBooksが重複している場合Error', async () => {
      await expect(() =>
        seriesService.create({
          title: 'よふかしのうた',
          relatedBooks: [book._id, book._id],
        }),
      ).rejects.toThrow(`Duplicate in the property "relatedBooks"`);
    });

    it('idに結びついたrelatedBooksが存在しない場合はError', async () => {
      await bookModel.deleteMany({});

      await expect(() =>
        seriesService.create({
          title: 'よふかしのうた',
          relatedBooks: [book._id],
        }),
      ).rejects.toThrow(
        `Not exist Book documents for given propertiy "relatedBooks"`,
      );
    });
  });
});
