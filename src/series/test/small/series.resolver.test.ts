import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {RelayConnection} from '../../../paginate/paginate.service';
import {AddBookToSeriesBooksArgs} from '../../dto/add-book-to-series-books.args';
import {SeriesBooksArgs} from '../../dto/books.args';
import {CreateSeriesInput} from '../../dto/create-series.input';
import {Series} from '../../schema/series.schema';
import {SeriesResolver} from '../../series.resolver';
import {SeriesService} from '../../series.service';

jest.mock('../../series.service');

describe(SeriesResolver.name, () => {
  let module: TestingModule;

  let seriesService: SeriesService;
  let seriesResolver: SeriesResolver;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [SeriesService, SeriesResolver],
    }).compile();

    seriesService = module.get<SeriesService>(SeriesService);
    seriesResolver = module.get<SeriesResolver>(SeriesResolver);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(seriesResolver).toBeDefined();
  });

  describe('series()', () => {
    it('Serviceから正常に取得できたらそれを返す', async () => {
      jest.spyOn(seriesService, 'getById').mockResolvedValueOnce({} as Series);

      const actual = await seriesResolver.series(new ObjectId().toHexString());
      expect(actual).toBeDefined();
    });

    it('Serviceから例外が投げられたらそのまま投げる', async () => {
      const id = new ObjectId();

      jest
        .spyOn(seriesService, 'getById')
        .mockRejectedValueOnce(new NoDocumentForObjectIdError(Series.name, id));

      await expect(() =>
        seriesResolver.series(id.toHexString()),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('ObjectIdとして不正な値を入力すると例外発生', async () => {
      await expect(() =>
        seriesResolver.series('Invalid ObjectId'),
      ).rejects.toThrow(Error);
    });
  });

  describe('allSeries()', () => {
    it('Serviceから正常に取得できたらそれを返す', async () => {
      jest.spyOn(seriesService, 'all').mockResolvedValueOnce([] as Series[]);

      const actual = await seriesResolver.allSeries();
      expect(actual).toBeDefined();
    });
  });

  describe('id()', () => {
    it('Serviceから正常に取得できたらそれをstringに戻して返す', async () => {
      const expected = new ObjectId();
      jest.spyOn(seriesService, 'id').mockReturnValueOnce(expected);

      const actual = await seriesResolver.id({_id: expected} as Series);
      expect(actual).toStrictEqual(expected.toHexString());
    });
  });

  describe('books()', () => {
    it('Serviceから正常に取得できたらそれを返す', async () => {
      jest
        .spyOn(seriesService, 'books')
        .mockResolvedValue(
          {} as RelayConnection<{id: ObjectId; serial: number}>,
        );
      const actual = seriesResolver.books({} as Series, {} as SeriesBooksArgs);

      expect(actual).toBeDefined();
    });
  });

  describe('relatedBooks()', () => {
    it('Serviceから正常に取得できたらそれを返す', async () => {
      jest
        .spyOn(seriesService, 'relatedBooks')
        .mockResolvedValue({} as RelayConnection<{id: ObjectId}>);
      const actual = seriesResolver.books({} as Series, {} as SeriesBooksArgs);

      expect(actual).toBeDefined();
    });
  });

  describe('createSeries()', () => {
    it('Serviceが正常に実行できたらそれを返す', async () => {
      jest.spyOn(seriesService, 'create').mockResolvedValue({} as Series);
      const actual = seriesResolver.createSeries({
        title: 'Series',
        books: [{id: new ObjectId().toHexString(), serial: 1}],
        relatedBooks: [{id: new ObjectId().toHexString()}],
      } as CreateSeriesInput);

      expect(actual).toBeDefined();
    });

    it('ObjectIdとして不正な値を入力すると例外発生', async () => {
      await expect(() =>
        seriesResolver.createSeries({
          title: 'Series',
          books: [{id: 'Invalid ObjectId', serial: 1}],
          relatedBooks: [{id: new ObjectId().toHexString()}],
        } as CreateSeriesInput),
      ).rejects.toThrow(Error);

      await expect(() =>
        seriesResolver.createSeries({
          title: 'Series',
          books: [{id: new ObjectId().toHexString(), serial: 1}],
          relatedBooks: [{id: 'Invalid ObjectId'}],
        } as CreateSeriesInput),
      ).rejects.toThrow(Error);
    });
  });

  describe('addBookToSeriesBooks()', () => {
    it('Serviceから正常に動作したらそれを返す', async () => {
      jest
        .spyOn(seriesService, 'addBookToBooks')
        .mockResolvedValue({} as Series);
      const actual = seriesResolver.addBookToSeriesBooks({
        seriesId: new ObjectId().toHexString(),
        bookId: new ObjectId().toHexString(),
      } as AddBookToSeriesBooksArgs);

      expect(actual).toBeDefined();
    });

    it('ObjectIdとして不正な値を入力すると例外発生', async () => {
      await expect(() =>
        seriesResolver.addBookToSeriesBooks({
          seriesId: 'Invalid ObjectId',
          bookId: new ObjectId().toHexString(),
        } as AddBookToSeriesBooksArgs),
      ).rejects.toThrow(Error);

      await expect(() =>
        seriesResolver.addBookToSeriesBooks({
          seriesId: new ObjectId().toHexString(),
          bookId: 'Invalid ObjectId',
        } as AddBookToSeriesBooksArgs),
      ).rejects.toThrow(Error);
    });
  });

  describe('addBookToSeriesRelatedBooks()', () => {
    it('Serviceから正常に動作したらそれを返す', async () => {
      jest
        .spyOn(seriesService, 'addBookToRelatedBooks')
        .mockResolvedValue({} as Series);
      const actual = seriesResolver.addBookToSeriesRelatedBooks({
        seriesId: new ObjectId().toHexString(),
        bookId: new ObjectId().toHexString(),
      } as AddBookToSeriesBooksArgs);

      expect(actual).toBeDefined();
    });

    it('ObjectIdとして不正な値を入力すると例外発生', async () => {
      await expect(() =>
        seriesResolver.addBookToSeriesRelatedBooks({
          seriesId: 'Invalid ObjectId',
          bookId: new ObjectId().toHexString(),
        } as AddBookToSeriesBooksArgs),
      ).rejects.toThrow(Error);

      await expect(() =>
        seriesResolver.addBookToSeriesRelatedBooks({
          seriesId: new ObjectId().toHexString(),
          bookId: 'Invalid ObjectId',
        } as AddBookToSeriesBooksArgs),
      ).rejects.toThrow(Error);
    });
  });
});
