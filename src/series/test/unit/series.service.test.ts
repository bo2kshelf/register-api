import {HttpModule} from '@nestjs/common';
import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {Series, SeriesSchema} from '../../schema/series.schema';
import {SeriesService} from '../../series.service';

describe('SeriesService', () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

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
        MongooseModule.forFeature([{name: Series.name, schema: SeriesSchema}]),
        HttpModule,
      ],
      providers: [SeriesService],
    }).compile();

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
      });

      const actual = seriesService.id(newSeries);

      expect(actual).toBe(newSeries._id);
    });
  });

  describe('getById()', () => {
    it('存在する場合はそれを返す', async () => {
      const newSeries = await seriesModel.create({
        title: 'よふかしのうた',
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
    it('全てのプロパティが存在する', async () => {
      const actual = await seriesService.create({title: 'よふかしのうた'});

      expect(actual).toHaveProperty('title', 'よふかしのうた');
    });
  });
});
