import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import {Author} from '../authors/schema/author.schema';
import {MongooseNotExistError} from '../error/mongoose-not-exist.error';
import {isArrayUnique} from '../util';
import {Book} from './schema/book.schema';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name)
    private readonly bookModel: Model<Book>,
    @InjectModel(Author.name)
    private readonly authorModel: Model<Author>,
  ) {}

  id(book: Book): string {
    return book._id;
  }

  async getById(id: string): Promise<Book> {
    const book = await this.bookModel.findById(id);

    if (book) return book;

    throw new MongooseNotExistError(Book.name, 'id', id);
  }

  async create({
    authors,
    ...data
  }: {
    title: string;
    authors: {id: string; roles?: string[]}[];
    isbn?: string;
  }): Promise<Book> {
    if (authors.length === 0)
      throw new Error(`The property "authors" is empty.`);

    const authorIDs = authors.map(({id: author}) => author);

    if (!isArrayUnique(authorIDs))
      throw new Error(`Duplicate ID of the author in the property "authors"`);

    const author = await Promise.all(
      authorIDs.map((id) =>
        this.authorModel.findById(id).then((author) => (author ? false : id)),
      ),
    ).then((array) => array.filter(Boolean));

    if (author.length > 0) throw new MongooseNotExistError(Author.name, 'id');

    return this.bookModel.create({authors, ...data});
  }
}
