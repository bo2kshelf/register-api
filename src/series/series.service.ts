import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {Author} from '../authors/schema/author.schema';
import {
  SeriesBooksConnection,
  SeriesRelatedBooksConnection,
} from '../books/connection/series-connection.entity';
import {Book} from '../books/schema/book.schema';
import {DuplicateValueInArrayError} from '../error/duplicate-values-in-array.error';
import {NoDocumentForObjectIdError} from '../error/no-document-for-objectid.error';
import {RequiredPaginationArgs} from '../paginate/dto/required-pagination.args';
import {OrderDirection} from '../paginate/enum/order-direction.enum';
import {PaginateService, RelayConnection} from '../paginate/paginate.service';
import {isArrayUnique} from '../util';
import {Series} from './schema/series.schema';

@Injectable()
export class SeriesService {
  constructor(
    @InjectModel(Series.name)
    private readonly seriesModel: Model<Series>,

    @InjectModel(Book.name)
    private readonly bookModel: Model<Book>,

    @InjectModel(Author.name)
    private readonly authorsModel: Model<Author>,

    private readonly paginateService: PaginateService,
  ) {}

  async all(): Promise<Series[]> {
    return this.seriesModel.find();
  }

  id(series: Series): ObjectId {
    return series._id;
  }

  async getById(id: ObjectId): Promise<Series> {
    const series = await this.seriesModel.findById(id);

    if (series) return series;

    throw new NoDocumentForObjectIdError(Series.name, id);
  }

  async create({
    books = [],
    relatedBooks = [],
    ...data
  }: {
    title: string;
    books?: SeriesBooksConnection[];
    relatedBooks?: SeriesRelatedBooksConnection[];
  }): Promise<Series> {
    if (!isArrayUnique(books.map(({serial}) => serial)))
      throw new DuplicateValueInArrayError('books.serial');

    const bookIds = books.map(({id}) => id);
    if (!isArrayUnique(bookIds))
      throw new DuplicateValueInArrayError('books.id');

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
      if (!isArrayUnique(relatedBookIds))
        throw new DuplicateValueInArrayError('relatedBooks.id');

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

  async books(
    series: Series,
    args: RequiredPaginationArgs,
    orderBy?: {serial?: OrderDirection},
  ): Promise<RelayConnection<{id: ObjectId; serial: number}>> {
    const seriesId = this.id(series);
    return this.paginateService.getConnectionFromMongooseModel(
      this.seriesModel,
      args,
      [{$match: {_id: seriesId}}, {$unwind: {path: '$books'}}],
      [
        {$match: {_id: seriesId}},
        {$unwind: {path: '$books'}},
        {$replaceRoot: {newRoot: '$books'}},
        {$sort: {serial: orderBy?.serial?.valueOf() || OrderDirection.ASC}},
      ],
    );
  }

  async relatedBooks(
    series: Series,
    args: RequiredPaginationArgs,
  ): Promise<RelayConnection<{id: ObjectId}>> {
    const seriesId = this.id(series);
    return this.paginateService.getConnectionFromMongooseModel(
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
        if (!actual)
          throw new NoDocumentForObjectIdError(Series.name, seriesId);
        return actual;
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
        if (!actual)
          throw new NoDocumentForObjectIdError(Series.name, seriesId);
        return actual;
      });
  }

  async relatedAuthors(series: Series): Promise<Author[]> {
    const bookIds = await this.seriesModel.aggregate([
      {$match: {_id: series._id}},
      {$project: {concat: {$concatArrays: ['$books.id', '$relatedBooks.id']}}},
      {$unwind: {path: '$concat'}},
      {$project: {_id: '$concat'}},
    ]);
    const authorIds = await this.bookModel.aggregate([
      {$match: {_id: {$in: bookIds.map(({_id}) => _id)}}},
      {$unwind: {path: '$authors'}},
      {$group: {_id: null, authors: {$addToSet: '$authors.id'}}},
      {$unwind: {path: '$authors'}},
      {$project: {_id: '$authors'}},
    ]);
    return this.authorsModel.find({_id: authorIds.map(({_id}) => _id)});
  }
}
