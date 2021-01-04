import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {AuthorDocument} from '../authors/schema/author.schema';
import {DuplicateValueInArrayError} from '../error/duplicate-values-in-array.error';
import {EmptyArrayError} from '../error/empty-array.error';
import {NoDocumentForObjectIdError} from '../error/no-document-for-objectid.error';
import {SeriesDocument} from '../series/schema/series.schema';
import {isArrayUnique} from '../util';
import {BookDocument} from './schema/book.schema';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(BookDocument.name)
    private readonly bookModel: Model<BookDocument>,

    @InjectModel(AuthorDocument.name)
    private readonly authorModel: Model<AuthorDocument>,

    @InjectModel(SeriesDocument.name)
    private readonly seriesModel: Model<SeriesDocument>,
  ) {}

  async all(): Promise<BookDocument[]> {
    return this.bookModel.find();
  }

  id(book: BookDocument): ObjectId {
    return book._id;
  }

  async getById(id: ObjectId): Promise<BookDocument> {
    const book = await this.bookModel.findById(id);

    if (book) return book;

    throw new NoDocumentForObjectIdError(BookDocument.name, id);
  }

  async create({
    authors,
    ...data
  }: {
    title: string;
    authors: {id: ObjectId; roles?: string[]}[];
    isbn?: string;
  }): Promise<BookDocument> {
    if (authors.length === 0) throw new EmptyArrayError('authors');

    const authorIds = authors.map(({id: author}) => author);

    if (!isArrayUnique(authorIds))
      throw new DuplicateValueInArrayError('authors.id');

    const actualIds: ObjectId[] = (
      await this.authorModel.find({_id: authorIds})
    ).map(({_id}) => _id);

    if (actualIds.length < authors.length)
      throw new NoDocumentForObjectIdError(
        AuthorDocument.name,
        authorIds.find((id) => !actualIds.includes(id))!,
      );

    return this.bookModel.create({
      authors,
      ...data,
    });
  }

  async relatedSeries(book: BookDocument): Promise<SeriesDocument[]> {
    return this.seriesModel.aggregate([
      {
        $match: {
          $or: [{'books.id': book._id}, {'relatedBooks.id': book._id}],
        },
      },
    ]);
  }
}
