import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {BookDocument} from '../../../books/schema/book.schema';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {
  PaginateService,
  RelayConnection,
} from '../../../paginate/paginate.service';
import {AuthorsService} from '../../authors.service';
import {Author, AuthorSchema} from '../../schema/author.schema';

describe(AuthorsService.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let authorModel: Model<Author>;

  let paginateService: PaginateService;

  let authorService: AuthorsService;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          useFactory: async () => ({
            uri: await mongoServer.getUri(),
          }),
        }),
        MongooseModule.forFeature([{name: Author.name, schema: AuthorSchema}]),
      ],
      providers: [
        {
          provide: PaginateService,
          useValue: {getConnectionFromMongooseModel() {}},
        },
        AuthorsService,
      ],
    }).compile();

    authorModel = module.get<Model<Author>>(getModelToken(Author.name));

    paginateService = module.get<PaginateService>(PaginateService);

    authorService = module.get<AuthorsService>(AuthorsService);
  });

  afterEach(async () => {
    jest.clearAllMocks();

    await authorModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoServer.stop();

    await module.close();
  });

  it('should be defined', () => {
    expect(authorService).toBeDefined();
  });

  describe('id()', () => {
    it('ObjectIDを取得', async () => {
      const expected = new ObjectId();
      const newAuthor = await authorModel.create({_id: expected, name: 'Name'});
      const actual = authorService.id(newAuthor);

      expect(actual).toBe(expected);
    });
  });

  describe('getById()', () => {
    let author: Author;
    let authorId: ObjectId;
    beforeEach(async () => {
      author = await authorModel.create({name: 'Name'});
      authorId = author._id;
    });

    it('存在する場合はそれを返す', async () => {
      const actual = await authorService.getById(authorId);

      expect(actual).toBeDefined();
      expect(actual).toHaveProperty('_id', authorId);
      expect(actual).toHaveProperty('name', author.name);
    });

    it('存在しない場合は例外を投げる', async () => {
      await author.remove();
      await expect(() => authorService.getById(authorId)).rejects.toThrow(
        NoDocumentForObjectIdError,
      );
    });
  });

  describe('all()', () => {
    it('何もなければ空配列を返す', async () => {
      const actual = await authorService.all();

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(0);
    });

    it('存在するならば配列を返す', async () => {
      for (let i = 0; i < 5; i++) await authorModel.create({name: 'Name'});

      const actual = await authorService.all();

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(5);
    });
  });

  describe('create()', () => {
    it('正常に生成できたらそれを返す', async () => {
      const actual = await authorService.create({name: 'Name'});

      expect(actual).toBeDefined();
      expect(actual).toHaveProperty('name', 'Name');
    });
  });

  describe('books()', () => {
    let author: Author;
    beforeEach(async () => {
      author = await authorModel.create({name: 'Name'});
    });

    it('受け取ったものをそのまま返す', async () => {
      jest
        .spyOn(paginateService, 'getConnectionFromMongooseModel')
        .mockResolvedValueOnce({} as RelayConnection<BookDocument>);

      const actual = await authorService.books(author, {});
      expect(actual).toBeDefined();
    });
  });
});
