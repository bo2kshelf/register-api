import {getModelToken} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {BookSeriesConnection} from '../../../books/connection/series.connection';
import {Book} from '../../../books/schema/book.schema';
import {DuplicateValueInArrayError} from '../../../error/duplicate-values-in-array.error';
import {EmptyArrayError} from '../../../error/empty-array.error';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {Series} from '../../schema/series.schema';
import {SeriesService} from '../../series.service';

describe('SeriesService', () => {
  let module: TestingModule;

  let seriesModel: Model<Series>;
  let bookModel: Model<Book>;

  let seriesService: SeriesService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: getModelToken(Series.name),
          useValue: {
            async findById() {},
            async create() {},
            async save() {},
          },
        },
        {
          provide: getModelToken(Book.name),
          useValue: {
            async findById() {},
            async find() {},
          },
        },
        SeriesService,
      ],
    }).compile();

    seriesModel = module.get<Model<Series>>(getModelToken(Series.name));
    bookModel = module.get<Model<Book>>(getModelToken(Book.name));

    seriesService = module.get<SeriesService>(SeriesService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(seriesService).toBeDefined();
  });

  describe('getById()', () => {
    it('idから見つかる場合はそのまま返す', async () => {
      jest.spyOn(seriesModel, 'findById').mockResolvedValueOnce({} as Series);
      const actual = await seriesService.getById(new ObjectId());
      expect(actual).toBeDefined();
    });

    it('idから見つからない場合は例外を投げる', async () => {
      jest.spyOn(seriesModel, 'findById').mockResolvedValueOnce(null);
      await expect(() => seriesService.getById(new ObjectId())).rejects.toThrow(
        NoDocumentForObjectIdError,
      );
    });
  });

  describe('id()', () => {
    it('Documentの_idを返す', async () => {
      const expected = new ObjectId();
      const book: Series = {_id: expected} as Series;

      const actual = seriesService.id(book);

      expect(actual).toStrictEqual(expected);
    });
  });

  describe('create()', () => {
    it('正常な動作', async () => {
      jest
        .spyOn(bookModel, 'find')
        .mockResolvedValue([
          {_id: new ObjectId()} as Book,
          {_id: new ObjectId()} as Book,
        ]);
      jest.spyOn(seriesModel, 'create').mockResolvedValueOnce({} as Series);

      const actual = await seriesService.create({
        title: 'title',
        books: [
          {id: new ObjectId(), serial: 1},
          {id: new ObjectId(), serial: 2},
        ],
        relatedBooks: [{id: new ObjectId()}, {id: new ObjectId()}],
      });

      expect(actual).toBeDefined();
    });

    it('booksが空配列なら例外を投げる', async () => {
      await expect(() =>
        seriesService.create({
          title: 'title',
          books: [],
          relatedBooks: [],
        }),
      ).rejects.toThrow(EmptyArrayError);
    });

    it('booksのidが重複していたら例外を投げる', async () => {
      const dupl = new ObjectId();
      await expect(() =>
        seriesService.create({
          title: 'title',
          books: [
            {id: dupl, serial: 1},
            {id: dupl, serial: 2},
          ],
          relatedBooks: [],
        }),
      ).rejects.toThrow(DuplicateValueInArrayError);
    });

    it('booksのserialが重複していたら例外を投げる', async () => {
      await expect(() =>
        seriesService.create({
          title: 'title',
          books: [
            {id: new ObjectId(), serial: 1},
            {id: new ObjectId(), serial: 1},
          ],
          relatedBooks: [],
        }),
      ).rejects.toThrow(DuplicateValueInArrayError);
    });

    it('booksのrelatedBooksが重複していたら例外を投げる', async () => {
      jest
        .spyOn(bookModel, 'find')
        .mockResolvedValue([
          {_id: new ObjectId()} as Book,
          {_id: new ObjectId()} as Book,
        ]);

      const dupl = new ObjectId();
      await expect(() =>
        seriesService.create({
          title: 'title',
          books: [
            {id: new ObjectId(), serial: 1},
            {id: new ObjectId(), serial: 2},
          ],
          relatedBooks: [{id: dupl}, {id: dupl}],
        }),
      ).rejects.toThrow(DuplicateValueInArrayError);
    });

    it('booksで一つでも取得不可能なものがあった場合例外を投げる', async () => {
      jest
        .spyOn(bookModel, 'find')
        .mockResolvedValue([{_id: new ObjectId()} as Book]);

      await expect(() =>
        seriesService.create({
          title: 'title',
          books: [
            {id: new ObjectId(), serial: 1},
            {id: new ObjectId(), serial: 2},
          ],
          relatedBooks: [],
        }),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });

    it('relatedBooksで一つでも取得不可能なものがあった場合例外を投げる', async () => {
      jest
        .spyOn(bookModel, 'find')
        .mockResolvedValue([{_id: new ObjectId()} as Book]);

      await expect(() =>
        seriesService.create({
          title: 'title',
          books: [{id: new ObjectId(), serial: 1}],
          relatedBooks: [{id: new ObjectId()}, {id: new ObjectId()}],
        }),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });
  });

  describe('getLastSerial()', () => {
    it('booksが一件もない場合は1を返す', () => {
      expect(
        seriesService.getLastSerial({
          books: [] as BookSeriesConnection[],
        } as Series),
      ).toBe(1);
    });

    it('booksがある場合は最も大きなserialを返す', () => {
      expect(
        seriesService.getLastSerial({
          books: [
            {serial: 1} as BookSeriesConnection,
            {serial: 2} as BookSeriesConnection,
            {serial: 1.5} as BookSeriesConnection,
          ],
        } as Series),
      ).toBe(2);
    });
  });

  describe('appendBookToSeriesBooks()', () => {
    it('serialがある場合', async () => {
      const series: Series = {
        books: [
          {serial: 1} as BookSeriesConnection,
          {serial: 2} as BookSeriesConnection,
          {serial: 3} as BookSeriesConnection,
        ] as BookSeriesConnection[],
        save() {},
      } as Series;

      jest.spyOn(bookModel, 'findById').mockResolvedValue({} as Book);

      const mockedSave = jest.spyOn(series, 'save');

      await seriesService.appendBookToSeriesBooks(series, new ObjectId(), 2.5);

      expect(mockedSave).toHaveBeenCalled();
      expect(series.books[3].serial).toBe(2.5);
    });

    it('serialが無い場合，最後のserialに1を足した値として追加', async () => {
      const series: Series = {
        books: [{serial: 1} as BookSeriesConnection],
        save() {},
      } as Series;

      jest.spyOn(bookModel, 'findById').mockResolvedValue({} as Book);

      const mockedSave = jest.spyOn(series, 'save');

      await seriesService.appendBookToSeriesBooks(series, new ObjectId());

      expect(mockedSave).toHaveBeenCalled();
      expect(series.books[1].serial).toBe(2);
    });

    it('serialが無くかつ最後のserialが小数点の場合，切り捨てた値に1を足した値として追加', async () => {
      const series: Series = {
        books: [{serial: 1.5} as BookSeriesConnection],
        save() {},
      } as Series;

      jest.spyOn(bookModel, 'findById').mockResolvedValue({} as Book);

      const mockedSave = jest.spyOn(series, 'save');

      await seriesService.appendBookToSeriesBooks(series, new ObjectId());

      expect(mockedSave).toHaveBeenCalled();
      expect(series.books[1].serial).toBe(2);
    });

    it('存在しないbookのIdを入力すると例外を投げる', async () => {
      jest.spyOn(bookModel, 'findById').mockResolvedValue(null);

      await expect(() =>
        seriesService.appendBookToSeriesBooks(
          {books: [] as BookSeriesConnection[]} as Series,
          new ObjectId(),
        ),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });
  });
});
