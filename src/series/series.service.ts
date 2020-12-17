import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {BookSeriesConnection} from '../books/connection/series.connection';
import {Book} from '../books/schema/book.schema';
import {MongooseNotExistError} from '../error/mongoose-not-exist.error';
import {NoDocumentForObjectIdError} from '../error/no-document-for-objectid.error';
import {RequiredPaginationArgs} from '../paginate/dto/required-pagination.argstype';
import {getConnectionFromMongooseModel} from '../paginate/paginate';
import {isArrayUnique} from '../util';
import {Series} from './schema/series.schema';

@Injectable()
export class SeriesService {
  constructor(
    @InjectModel(Series.name)
    private readonly seriesModel: Model<Series>,

    @InjectModel(Book.name)
    private readonly bookModel: Model<Book>,
  ) {}

  id(series: Series): ObjectId {
    return series._id;
  }

  async getById(id: ObjectId): Promise<Series> {
    const series = await this.seriesModel.findById(id);

    if (series) return series;

    throw new NoDocumentForObjectIdError(Series.name, id);
  }

  async create({
    books,
    relatedBooks = [],
    ...data
  }: {
    title: string;
    relatedBooks?: ObjectId[];
    books: BookSeriesConnection[];
  }): Promise<Series> {
    if (books.length === 0) throw new Error(`The property "book" is empty`);

    if (!isArrayUnique(books.map(({id}) => id)))
      throw new Error(`Duplicate in the property "books"`);

    if (!isArrayUnique(books.map(({serial}) => serial)))
      throw new Error(`Duplicate in the property "books"`);

    if (!isArrayUnique(relatedBooks))
      throw new Error(`Duplicate in the property "relatedBooks"`);

    if (
      (await this.bookModel.find({_id: books.map(({id}) => id)})).length !==
      books.length
    )
      throw new MongooseNotExistError(Book.name, 'books');

    if (
      (await this.bookModel.find({_id: relatedBooks})).length !==
      relatedBooks.length
    )
      throw new MongooseNotExistError(Book.name, 'relatedBooks');

    return this.seriesModel.create({books, relatedBooks, ...data});
  }

  async books(series: Series, args: RequiredPaginationArgs) {
    const seriesId = this.id(series);
    return getConnectionFromMongooseModel(
      this.seriesModel,
      args,
      [{$match: {_id: seriesId}}, {$unwind: {path: '$books'}}],
      [
        {$match: {_id: seriesId}},
        {$unwind: {path: '$books'}},
        {$replaceRoot: {newRoot: '$books'}},
        {$sort: {serial: 1}},
      ],
    );
  }

  async relatedBooks(series: Series) {
    return series.relatedBooks;
  }
}
