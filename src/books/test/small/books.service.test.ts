import {getModelToken} from '@nestjs/mongoose';
import {Test, TestingModule} from '@nestjs/testing';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {Author} from '../../../authors/schema/author.schema';
import {DuplicateValueInArrayError} from '../../../error/duplicate-values-in-array.error';
import {EmptyArrayError} from '../../../error/empty-array.error';
import {MongooseNotExistError} from '../../../error/mongoose-not-exist.error';
import {NoDocumentForObjectIdError} from '../../../error/no-document-for-objectid.error';
import {BooksService} from '../../books.service';
import {Book} from '../../schema/book.schema';

describe('BookService', () => {
  let module: TestingModule;

  let bookModel: Model<Book>;
  let authorModel: Model<Author>;

  let bookService: BooksService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: getModelToken(Book.name),
          useValue: {findById() {}, create() {}},
        },
        {
          provide: getModelToken(Author.name),
          useValue: {findById() {}, create() {}},
        },
        BooksService,
      ],
    }).compile();

    bookModel = module.get<Model<Book>>(getModelToken(Book.name));
    authorModel = module.get<Model<Author>>(getModelToken(Author.name));

    bookService = module.get<BooksService>(BooksService);
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

  describe('getById()', () => {
    it('idから見つかる場合はそのまま返す', async () => {
      jest.spyOn(bookModel, 'findById').mockResolvedValueOnce({} as Book);
      const actual = await bookService.getById(new ObjectId());
      expect(actual).toBeDefined();
    });

    it('idから見つからない場合は例外を投げる', async () => {
      jest.spyOn(bookModel, 'findById').mockResolvedValueOnce(null);
      await expect(() => bookService.getById(new ObjectId())).rejects.toThrow(
        NoDocumentForObjectIdError,
      );
    });
  });

  describe('id()', () => {
    it('Documentの_idを返す', async () => {
      const expected = new ObjectId();
      const book: Book = {_id: expected} as Book;

      const actual = bookService.id(book);

      expect(actual).toStrictEqual(expected);
    });
  });

  describe('create()', () => {
    it('期待されるプロパティが全て存在する', async () => {
      jest
        .spyOn(authorModel, 'findById')
        .mockResolvedValue({_id: new ObjectId()} as Author);
      jest.spyOn(bookModel, 'create').mockResolvedValueOnce({} as Book);

      const actual = bookService.create({
        title: 'title',
        isbn: '9784091294920',
        authors: [
          {id: new ObjectId(), roles: ['original']},
          {id: new ObjectId(), roles: ['illust']},
        ],
      });

      expect(actual).toBeDefined();
    });

    it('ISBNが無くても成功する', async () => {
      jest
        .spyOn(authorModel, 'findById')
        .mockResolvedValue({_id: new ObjectId()} as Author);
      jest.spyOn(bookModel, 'create').mockResolvedValueOnce({} as Book);

      const actual = bookService.create({
        title: 'title',
        authors: [
          {id: new ObjectId(), roles: ['original']},
          {id: new ObjectId(), roles: ['illust']},
        ],
      });
      expect(actual).toBeDefined();
    });

    it('rolesが無くても成功する', async () => {
      jest
        .spyOn(authorModel, 'findById')
        .mockResolvedValue({_id: new ObjectId()} as Author);
      jest.spyOn(bookModel, 'create').mockResolvedValueOnce({} as Book);

      const actual = bookService.create({
        title: 'title',
        authors: [{id: new ObjectId()}, {id: new ObjectId()}],
      });

      expect(actual).toBeDefined();
    });

    it('authorsが空配列ならば例外を投げる', async () => {
      await expect(() =>
        bookService.create({title: 'title', authors: []}),
      ).rejects.toThrow(EmptyArrayError);
    });

    it('authorsのidが重複していたら例外を投げる', async () => {
      const dupl = new ObjectId();

      await expect(() =>
        bookService.create({title: 'title', authors: [{id: dupl}, {id: dupl}]}),
      ).rejects.toThrow(DuplicateValueInArrayError);
    });

    it('authorsのidが一つでも存在しなければ例外を投げる', async () => {
      const existId = new ObjectId();

      jest
        .spyOn(authorModel, 'findById')
        .mockResolvedValue({_id: existId} as Author)
        .mockResolvedValue(null);

      await expect(() =>
        bookService.create({
          title: 'title',
          authors: [{id: existId}, {id: new ObjectId()}],
        }),
      ).rejects.toThrow(MongooseNotExistError);
    });
  });
});
