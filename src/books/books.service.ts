import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {Author} from '../authors/schema/author.schema';
import {DuplicateValueInArrayError} from '../error/duplicate-values-in-array.error';
import {EmptyArrayError} from '../error/empty-array.error';
import {NoDocumentForObjectIdError} from '../error/no-document-for-objectid.error';
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

  id(book: Book): ObjectId {
    return book._id;
  }

  async getById(id: ObjectId): Promise<Book> {
    const book = await this.bookModel.findById(id);

    if (book) return book;

    throw new NoDocumentForObjectIdError(Book.name, id);
  }

  async create({
    authors,
    ...data
  }: {
    title: string;
    authors: {id: ObjectId; roles?: string[]}[];
    isbn?: string;
  }): Promise<Book> {
    if (authors.length === 0) throw new EmptyArrayError('authors');

    const authorIds = authors.map(({id: author}) => author);

    if (!isArrayUnique(authorIds))
      throw new DuplicateValueInArrayError('authors.id');

    const actualIds: ObjectId[] = (
      await this.authorModel.find({_id: authorIds})
    ).map(({_id}) => _id);

    if (actualIds.length < authors.length)
      throw new NoDocumentForObjectIdError(
        Author.name,
        authorIds.find((id) => !actualIds.includes(id))!,
      );

    return this.bookModel.create({
      authors,
      ...data,
    });
  }
}
