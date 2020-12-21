import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {
  BookSeriesConnection,
  BookSeriesRelatedBookConnection,
} from '../books/connection/series.connection';
import {Book} from '../books/schema/book.schema';
import {checkIfArrayUnique, checkIfNotArrayEmpty} from '../common';
import {NoDocumentForObjectIdError} from '../error/no-document-for-objectid.error';
import {RequiredPaginationArgs} from '../paginate/dto/required-pagination.argstype';
import {getConnectionFromMongooseModel} from '../paginate/paginate';
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
    books: BookSeriesConnection[];
    relatedBooks?: BookSeriesRelatedBookConnection[];
  }): Promise<Series> {
    checkIfNotArrayEmpty(books, 'books');

    checkIfArrayUnique(
      books.map(({serial}) => serial),
      'books.serial',
    );

    const bookIds = books.map(({id}) => id);
    checkIfArrayUnique(bookIds, 'books.id');

    const actualBookIds: ObjectId[] = (
      await this.bookModel.find({_id: bookIds})
    ).map(({id}) => id);
    if (actualBookIds.length < bookIds.length)
      throw new NoDocumentForObjectIdError(
        Book.name,
        bookIds.find((id) => !actualBookIds.includes(id))!,
      );

    if (relatedBooks.length > 0) {
      const relatedBookIds = relatedBooks.map(({id}) => id);
      checkIfArrayUnique(relatedBookIds, 'relatedBooks.id');

      const actualrelatedBookIds: ObjectId[] = (
        await this.bookModel.find({_id: relatedBookIds})
      ).map(({_id}) => _id);
      if (actualrelatedBookIds.length < relatedBooks.length)
        throw new NoDocumentForObjectIdError(
          Book.name,
          relatedBookIds.find((id) => !actualrelatedBookIds.includes(id))!,
        );
    }

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

  async relatedBooks(series: Series, args: RequiredPaginationArgs) {
    const seriesId = this.id(series);
    return getConnectionFromMongooseModel(
      this.seriesModel,
      args,
      [{$match: {_id: seriesId}}, {$unwind: {path: '$relatedBooks'}}],
      [
        {$match: {_id: seriesId}},
        {$unwind: {path: '$relatedBooks'}},
        {$replaceRoot: {newRoot: '$relatedBooks'}},
        {$sort: {serial: 1}},
      ],
    );
  }

  getLastSerial(series: Series) {
    if (series.books.length === 0) return 1;
    return series.books.sort(
      ({serial: serialA}, {serial: serialB}) => serialB - serialA,
    )[0].serial;
  }

  async addBookToBooks(seriesId: ObjectId, bookId: ObjectId, serial: number) {
    if (!(await this.bookModel.findById(bookId).then((book) => Boolean(book))))
      throw new NoDocumentForObjectIdError(Book.name, bookId);

    if (
      await this.seriesModel
        .findOne({
          _id: seriesId,
          $or: [{'books.serial': serial}, {'books.id': bookId}],
        })
        .then(Boolean)
    )
      throw new Error(
        `Already exists serial ${serial} or book ${bookId.toHexString()} in series ${seriesId.toHexString()}.`,
      );

    return this.seriesModel
      .findByIdAndUpdate(
        seriesId,
        {$push: {books: {id: bookId, serial}}},
        {new: true},
      )
      .then((actual) => {
        if (actual) return actual;
        throw new NoDocumentForObjectIdError(Series.name, seriesId);
      });
  }

  async addBookToRelatedBooks(seriesId: ObjectId, bookId: ObjectId) {
    if (!(await this.bookModel.findById(bookId).then((book) => Boolean(book))))
      throw new NoDocumentForObjectIdError(Book.name, bookId);

    if (
      await this.seriesModel
        .findOne({
          _id: seriesId,
          'relatedBooks.id': bookId,
        })
        .then(Boolean)
    )
      throw new Error(
        `Already exists book ${bookId.toHexString()} in series ${seriesId.toHexString()}.`,
      );

    return this.seriesModel
      .findByIdAndUpdate(
        seriesId,
        {$push: {relatedBooks: {id: bookId}}},
        {new: true},
      )
      .then((actual) => {
        if (actual) return actual;
        throw new NoDocumentForObjectIdError(Series.name, seriesId);
      });
  }
}
