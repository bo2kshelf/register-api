import {getModelToken, MongooseModule} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {lorem} from 'faker';
import * as Relay from 'graphql-relay';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {Model} from 'mongoose';
import {Book, BookSchema} from '../../../books/schema/book.schema';
import {MongooseNotExistError} from '../../../error/mongoose-not-exist.error';
import {AuthorsService} from '../../authors.service';
import {Author, AuthorSchema} from '../../schema/author.schema';

jest.mock('graphql-relay', () => ({
  ...jest.requireActual('graphql-relay')!,
}));

describe('AuthorService', () => {
  let mongoServer: MongoMemoryServer;

  let module: TestingModule;

  let bookModel: Model<Book>;
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
        MongooseModule.forFeature([
          {name: Author.name, schema: AuthorSchema},
          {name: Book.name, schema: BookSchema},
        ]),
      ],
      providers: [AuthorsService],
    }).compile();

    bookModel = module.get<Model<Book>>(getModelToken(Book.name));
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

  describe('books()', () => {
    let author: Author;
    beforeEach(async () => {
      author = await authorModel.create({name: 'コトヤマ'});
      for (let i = 0; i < 30; i++) {
        await bookModel.create({
          title: lorem.word(),
          authors: [{id: author._id}],
        });
      }
    });

    it('firstのみ指定', async () => {
      const actual = await authorService.books(author, {first: 10});
      expect(actual).toHaveProperty('aggregate', {count: 30});

      expect(actual).toHaveProperty('pageInfo');
      expect(actual.pageInfo).toHaveProperty('startCursor');
      expect(actual.pageInfo).toHaveProperty('endCursor');
      expect(actual.pageInfo).toHaveProperty('hasPreviousPage', false);
      expect(actual.pageInfo).toHaveProperty('hasNextPage', true);

      expect(actual).toHaveProperty('edges');
      expect(actual.edges).toHaveLength(10);
    });

    it('firstのみ指定(max < first)', async () => {
      const actual = await authorService.books(author, {first: 40});
      expect(actual).toHaveProperty('aggregate', {count: 30});

      expect(actual).toHaveProperty('pageInfo');
      expect(actual.pageInfo).toHaveProperty('startCursor');
      expect(actual.pageInfo).toHaveProperty('endCursor');
      expect(actual.pageInfo).toHaveProperty('hasPreviousPage', false);
      expect(actual.pageInfo).toHaveProperty('hasNextPage', false);

      expect(actual).toHaveProperty('edges');
      expect(actual.edges).toHaveLength(30);
    });

    it('firstとafterを指定', async () => {
      jest.spyOn(Relay, 'cursorToOffset').mockReturnValueOnce(10);

      const actual = await authorService.books(author, {
        first: 10,
        after: '10',
      });

      expect(actual).toHaveProperty('aggregate', {count: 30});

      expect(actual).toHaveProperty('pageInfo');

      expect(actual).toHaveProperty('edges');
      expect(actual.edges).toHaveLength(10);
    });

    it('beforeとlastを指定', async () => {
      jest.spyOn(Relay, 'cursorToOffset').mockReturnValueOnce(10);

      const actual = await authorService.books(author, {
        last: 10,
        before: '20',
      });

      expect(actual).toHaveProperty('aggregate', {count: 30});

      expect(actual).toHaveProperty('pageInfo');

      expect(actual).toHaveProperty('edges');
      expect(actual.edges).toHaveLength(10);
    });
  });
});
