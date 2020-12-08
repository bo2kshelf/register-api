import {HttpModule} from '@nestjs/common';
import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {MongooseNotExistError} from '../../../error/mongoose-not-exist.error';
import {AuthorsService} from '../../authors.service';
import {Author, AuthorSchema} from '../../schema/author.schema';

describe('AuthorService', () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let authorModel: Model<Author>;

  let authorService: AuthorsService;

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
        HttpModule,
      ],
      providers: [AuthorsService],
    }).compile();

    authorModel = module.get<Model<Author>>(getModelToken(Author.name));

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
      const newAuthor = await authorModel.create({
        name: 'コトヤマ',
      });

      const actual = authorService.id(newAuthor);

      expect(actual).toBe(newAuthor._id);
    });
  });

  describe('getById()', () => {
    it('存在する場合はそれを返す', async () => {
      const newAuthor = await authorModel.create({
        name: 'コトヤマ',
      });

      const actual = await authorService.getById(authorService.id(newAuthor));

      expect(actual).toHaveProperty('name', 'コトヤマ');
    });

    it('存在しない場合はError', async () => {
      await expect(() =>
        authorService.getById('5fccac3585e5265603349e97'),
      ).rejects.toThrow(MongooseNotExistError);
    });
  });

  describe('create()', () => {
    it('全てのプロパティが存在する', async () => {
      const actual = await authorService.create({name: 'コトヤマ'});

      expect(actual).toHaveProperty('name', 'コトヤマ');
    });
  });
});
