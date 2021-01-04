import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {BookDocument, BookSchema} from '../../../books/schema/book.schema';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {
  PaginateService,
  RelayConnection,
} from '../../../paginate/paginate.service';
import {AuthorsResolver} from '../../authors.resolver';
import {AuthorsService} from '../../authors.service';
import {AuthorDocument, AuthorSchema} from '../../schema/author.schema';

describe(AuthorsResolver.name, () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let authorModel: Model<AuthorDocument>;

  let paginateService: PaginateService;

  let authorService: AuthorsService;
  let authorResolver: AuthorsResolver;

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
          {name: AuthorDocument.name, schema: AuthorSchema},
          {name: BookDocument.name, schema: BookSchema},
        ]),
      ],
      providers: [
        {
          provide: PaginateService,
          useValue: {getConnectionFromMongooseModel() {}},
        },
        AuthorsResolver,
        AuthorsService,
      ],
    }).compile();

    authorModel = module.get<Model<AuthorDocument>>(
      getModelToken(AuthorDocument.name),
    );

    paginateService = module.get<PaginateService>(PaginateService);

    authorService = module.get<AuthorsService>(AuthorsService);
    authorResolver = module.get<AuthorsResolver>(AuthorsResolver);
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
    expect(authorResolver).toBeDefined();
  });

  describe('author()', () => {
    let author: AuthorDocument;
    let authorId: ObjectId;
    beforeEach(async () => {
      author = await authorModel.create({name: 'Name'});
      authorId = author._id;
    });

    it('存在するならばそれを返す', async () => {
      const actual = await authorResolver.author(authorId.toHexString());

      expect(actual).toBeDefined();
      expect(actual).toHaveProperty('_id', authorId);
      expect(actual).toHaveProperty('name', author.name);
    });

    it('存在しない場合はErrorを返す', async () => {
      await author.remove();
      await expect(() =>
        authorResolver.author(authorId.toHexString()),
      ).rejects.toThrow(NoDocumentForObjectIdError);
    });
  });

  describe('allAuthors()', () => {
    it('何もなければ空配列を返す', async () => {
      const actual = await authorResolver.allAuthors();

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(0);
    });

    it('存在するならば配列を返す', async () => {
      for (let i = 0; i < 5; i++) await authorModel.create({name: 'Name'});

      const actual = await authorResolver.allAuthors();

      expect(actual).toBeDefined();
      expect(actual).toHaveLength(5);
    });
  });

  describe('id()', () => {
    it('StringとしてIDを取得', async () => {
      const newAuthor = await authorModel.create({name: 'Name'});
      const expected = newAuthor._id.toHexString();
      const actual = authorResolver.id(newAuthor);

      expect(actual).toBe(expected);
    });
  });

  describe('books()', () => {
    let author: AuthorDocument;
    beforeEach(async () => {
      author = await authorModel.create({name: 'Name'});
    });

    it('受け取ったものをそのまま返す', async () => {
      jest
        .spyOn(authorService, 'books')
        .mockResolvedValueOnce({} as RelayConnection<BookDocument>);

      const actual = await authorService.books(author, {});
      expect(actual).toBeDefined();
    });
  });

  describe('createAuthor()', () => {
    it('正常に生成できたらそれを返す', async () => {
      const actual = await authorResolver.createAuthor({name: 'Name'});

      expect(actual).toBeDefined();
      expect(actual).toHaveProperty('name', 'Name');
    });
  });
});
