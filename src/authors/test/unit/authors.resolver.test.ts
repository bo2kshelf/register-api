import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {MongooseNotExistError} from '../../../error/mongoose-not-exist.error';
import {AuthorsResolver} from '../../authors.resolver';
import {AuthorsService} from '../../authors.service';
import {Author, AuthorSchema} from '../../schema/author.schema';

describe('AuthorResolver', () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let authorModel: Model<Author>;

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
        MongooseModule.forFeature([{name: Author.name, schema: AuthorSchema}]),
      ],
      providers: [
        {
          provide: AuthorsService,
          useValue: {
            getById() {},
            id: (Author: Author) => Author._id,
            create() {},
          },
        },
        AuthorsResolver,
      ],
    }).compile();

    authorModel = module.get<Model<Author>>(getModelToken(Author.name));

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

  describe('Author()', () => {
    it('存在するならばそれを返す', async () => {
      const newAuthor = await authorModel.create({name: 'コトヤマ'});

      jest.spyOn(authorService, 'getById').mockResolvedValueOnce(newAuthor);

      const actual = await authorResolver.author(newAuthor._id);

      expect(actual).toHaveProperty('name', 'コトヤマ');
    });

    it('存在しない場合はErrorを返す', async () => {
      jest
        .spyOn(authorService, 'getById')
        .mockRejectedValueOnce(
          new MongooseNotExistError(
            Author.name,
            'id',
            '5fccac3585e5265603349e97',
          ),
        );

      await expect(() =>
        authorResolver.author('5fccac3585e5265603349e97'),
      ).rejects.toThrow(MongooseNotExistError);
    });
  });

  describe('id()', () => {
    it('適切なIDを返す', async () => {
      const newAuthor = await authorModel.create({name: 'コトヤマ'});

      const actual = await authorResolver.id(newAuthor);

      expect(actual).toBe(newAuthor._id);
    });
  });

  describe('createAuthor()', () => {
    it('全てのプロパティが存在する', async () => {
      const newAuthor = await authorModel.create({name: 'コトヤマ'});

      jest.spyOn(authorService, 'create').mockResolvedValueOnce(newAuthor);

      const actual = await authorResolver.createAuthor({name: 'コトヤマ'});

      expect(actual).toHaveProperty('name', 'コトヤマ');
    });
  });
});
