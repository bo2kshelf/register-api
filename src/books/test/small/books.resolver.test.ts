import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {BooksResolver} from '../../books.resolver';
import {BooksService} from '../../books.service';
import {Book} from '../../schema/book.schema';

describe(BooksService.name, () => {
  let module: TestingModule;

  let bookService: BooksService;
  let bookResolver: BooksResolver;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: BooksService,
          useValue: {id() {}, async getById() {}, async create() {}},
        },
        BooksResolver,
      ],
    }).compile();

    bookService = module.get<BooksService>(BooksService);
    bookResolver = module.get<BooksResolver>(BooksResolver);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(bookService).toBeDefined();
  });

  describe('book()', () => {
    it('book.serviceから正常に取得できた場合はそのまま返す', async () => {
      jest.spyOn(bookService, 'getById').mockResolvedValueOnce({} as Book);

      const actual = bookResolver.book(new ObjectId());

      expect(actual).toBeDefined();
    });

    it('book.serviceから例外が投げられた場合そのまま投げる', async () => {
      jest
        .spyOn(bookService, 'getById')
        .mockRejectedValueOnce(
          new NoDocumentForObjectIdError(Book.name, new ObjectId()),
        );
      await expect(() => bookResolver.book(new ObjectId())).rejects.toThrow(
        NoDocumentForObjectIdError,
      );
    });
  });
});
