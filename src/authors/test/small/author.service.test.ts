import {getModelToken} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {PaginateService} from '../../../paginate/paginate.service';
import {AuthorsService} from '../../authors.service';
import {Author} from '../../schema/author.schema';

describe(AuthorsService.name, () => {
  let module: TestingModule;

  let authorModel: Model<Author>;

  let authorService: AuthorsService;
  let paginateService: PaginateService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: getModelToken(Author.name),
          useValue: {id() {}, async findById() {}, async create() {}},
        },
        {
          provide: PaginateService,
          useValue: {
            getConnectionFromMongooseModel() {},
          },
        },
        AuthorsService,
      ],
    }).compile();

    authorModel = module.get<Model<Author>>(getModelToken(Author.name));

    authorService = module.get<AuthorsService>(AuthorsService);
    paginateService = module.get<PaginateService>(PaginateService);
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
    it('idから見つかる場合はそのまま返す', async () => {
      jest.spyOn(authorModel, 'findById').mockResolvedValueOnce({} as Author);
      const actual = await authorService.getById(new ObjectId());
      expect(actual).toBeDefined();
    });

    it('idから見つからない場合は例外を投げる', async () => {
      jest.spyOn(authorModel, 'findById').mockResolvedValueOnce(null);
      await expect(() => authorService.getById(new ObjectId())).rejects.toThrow(
        NoDocumentForObjectIdError,
      );
    });
  });

  describe('id()', () => {
    it('Documentの_idを返す', async () => {
      const expected = new ObjectId();
      const book: Author = {_id: expected} as Author;

      const actual = authorService.id(book);

      expect(actual).toStrictEqual(expected);
    });
  });

  describe('create()', () => {
    it('期待されるプロパティが全て存在する', async () => {
      jest.spyOn(authorModel, 'create').mockResolvedValueOnce({} as Author);

      const actual = authorService.create({
        name: 'name',
      });

      expect(actual).toBeDefined();
    });
  });

  describe('books()', () => {
    it('正常な動作', async () => {
      jest
        .spyOn(paginateService, 'getConnectionFromMongooseModel')
        .mockResolvedValue({
          aggregate: {count: 0},
          edges: [],
          pageInfo: {},
        });

      const actual = authorService.books({_id: new ObjectId()} as Author, {
        first: 1,
      });

      expect(actual).toBeDefined();
    });
  });
});
