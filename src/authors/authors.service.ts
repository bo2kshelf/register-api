import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {BookDocument} from '../books/schema/book.schema';
import {NoDocumentForObjectIdError} from '../error/no-document-for-objectid.error';
import {RequiredPaginationArgs} from '../paginate/dto/required-pagination.args';
import {PaginateService, RelayConnection} from '../paginate/paginate.service';
import {AuthorDocument} from './schema/author.schema';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectModel(AuthorDocument.name)
    private readonly authorModel: Model<AuthorDocument>,
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
      AuthorDocument,
      BookDocument
    >(
      this.authorModel,
      args,
      [
        {$match: {_id: authorId}},
        {
          $lookup: {
            from: 'books',
            foreignField: 'authors.id',
            localField: '_id',
            as: 'books',
          },
        },
        {$unwind: {path: '$books'}},
      ],
      [
        {$match: {_id: authorId}},
        {
          $lookup: {
            from: 'books',
            foreignField: 'authors.id',
            localField: '_id',
            as: 'books',
          },
        },
        {$unwind: {path: '$books'}},
        {$replaceRoot: {newRoot: '$books'}},
        {$sort: {_id: 1}},
      ],
    );
  }
}
