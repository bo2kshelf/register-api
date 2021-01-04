import {getModelToken} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {BookDocument} from '../../../books/schema/book.schema';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {modelMockFactory} from '../../../mongoose/model.mock.factory';
import {
  PaginateService,
  RelayConnection,
} from '../../../paginate/paginate.service';
import {AuthorsService} from '../../authors.service';
import {AuthorDocument} from '../../schema/author.schema';

jest.mock('../../../paginate/paginate.service');

describe(AuthorsService.name, () => {
  let module: TestingModule;

  let authorModel: Model<AuthorDocument>;

  let paginateService: PaginateService;

  let authorService: AuthorsService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: getModelToken(AuthorDocument.name),
          useFactory: modelMockFactory,
        },
        {
          provide: getModelToken(BookDocument.name),
          useFactory: modelMockFactory,
        },
        PaginateService,
        AuthorsService,
      ],
    }).compile();

    authorModel = module.get<Model<AuthorDocument>>(
      getModelToken(AuthorDocument.name),
    );
    paginateService = module.get<PaginateService>(PaginateService);

    authorService = module.get<AuthorsService>(AuthorsService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(authorService).toBeDefined();
  });

  describe('getById()', () => {
    it('正常に取得できたらそれを返す', async () => {
      jest
        .spyOn(authorModel, 'findById')
        .mockResolvedValueOnce({} as AuthorDocument);

      const actual = await authorService.getById(new ObjectId());
      expect(actual).toBeDefined();
    });

    it('存在しない場合は例外を投げる', async () => {
      jest.spyOn(authorModel, 'findById').mockResolvedValueOnce(null);

      await expect(() => authorService.getById(new ObjectId())).rejects.toThrow(
        NoDocumentForObjectIdError,
      );
    });
  });

  describe('all()', () => {
    it('受け取ったものをそのまま返す', async () => {
      jest
        .spyOn(authorModel, 'find')
        .mockResolvedValueOnce([{} as AuthorDocument]);

      const actual = await authorService.all();
      expect(actual).toBeDefined();
    });
  });

  describe('id()', () => {
    it('引数の_idをそのまま返す', () => {
      const expected = new ObjectId();

      const actual = authorService.id({_id: expected} as AuthorDocument);

      expect(actual).toStrictEqual(expected);
    });
  });

  describe('create()', () => {
    it('受け取ったものをそのまま返す', async () => {
      jest
        .spyOn(authorModel, 'create')
        .mockResolvedValueOnce({} as AuthorDocument);

      const actual = await authorService.create({name: 'Name'});
      expect(actual).toBeDefined();
    });
  });

  describe('books()', () => {
    it('受け取ったものをそのまま返す', async () => {
      jest.spyOn(authorService, 'id').mockReturnValue(new ObjectId());
      jest
        .spyOn(paginateService, 'getConnectionFromMongooseModel')
        .mockResolvedValueOnce({} as RelayConnection<BookDocument>);

      const actual = await authorService.books({} as AuthorDocument, {});
      expect(actual).toBeDefined();
    });
  });
});
