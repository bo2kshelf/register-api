import {getModelToken} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {Book} from '../../../books/schema/book.schema';
import {DuplicateValueInArrayError} from '../../../error/duplicate-values-in-array.error';
import {EmptyArrayError} from '../../../error/empty-array.error';
import {MongooseNotExistError} from '../../../error/mongoose-not-exist.error';
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
      ).rejects.toThrow(MongooseNotExistError);
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
      ).rejects.toThrow(MongooseNotExistError);
    });
  });
});
