import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {BookDocument} from '../books/schema/book.schema';
import {NoDocumentForObjectIdError} from '../error/no-document-for-objectid.error';
import {RequiredPaginationArgs} from '../paginate/dto/required-pagination.args';
import {PaginateService, RelayConnection} from '../paginate/paginate.service';
import {SeriesDocument} from '../series/schema/series.schema';
import {AuthorDocument} from './schema/author.schema';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectModel(AuthorDocument.name)
    private readonly authorModel: Model<AuthorDocument>,

    @InjectModel(BookDocument.name)
    private readonly bookModel: Model<BookDocument>,

    @InjectModel(SeriesDocument.name)
    private readonly seriesModel: Model<SeriesDocument>,

    private readonly paginateService: PaginateService,
  ) {}

  id(author: AuthorDocument): ObjectId {
    return author._id;
  }

  async all(): Promise<AuthorDocument[]> {
    return this.authorModel.find();
  }

  async getById(id: ObjectId): Promise<AuthorDocument> {
    const author = await this.authorModel.findById(id);

    if (author) return author;

    throw new NoDocumentForObjectIdError(AuthorDocument.name, id);
  }

  async create(data: {name: string}): Promise<AuthorDocument> {
    return this.authorModel.create({...data});
  }

  async books(
    author: AuthorDocument,
    args: RequiredPaginationArgs,
  ): Promise<RelayConnection<BookDocument>> {
    const authorId = this.id(author);
    return this.paginateService.getConnectionFromMongooseModel<
      BookDocument,
      BookDocument
    >(
      this.bookModel,
      args,
      [{$match: {'authors.id': author._id}}],
      [{$match: {'authors.id': author._id}}],
    );
  }

  async relatedSeries(
    author: AuthorDocument,
    {
      include = {books: true, relatedBooks: false},
      ...connArgs
    }: RequiredPaginationArgs & {
      include?: {books: boolean; relatedBooks: boolean};
    },
  ): Promise<RelayConnection<SeriesDocument>> {
    const bookIds: ObjectId[] = (
      await this.bookModel.aggregate([{$match: {'authors.id': author._id}}])
    ).map(({_id}) => _id);

    return this.paginateService.getConnectionFromMongooseModel<
      SeriesDocument,
      SeriesDocument
    >(
      this.seriesModel,
      connArgs,
      [
        {
          $match: {
            $or: [
              include.books && {'books.id': {$in: bookIds}},
              include.relatedBooks && {'relatedBooks.id': {$in: bookIds}},
            ].filter(Boolean),
          },
        },
      ],
      [
        {
          $match: {
            $or: [
              include.books && {'books.id': {$in: bookIds}},
              include.relatedBooks && {'relatedBooks.id': {$in: bookIds}},
            ].filter(Boolean),
          },
        },
      ],
    );
  }
}
