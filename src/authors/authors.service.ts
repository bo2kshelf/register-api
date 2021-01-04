import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {BookDocument} from '../books/schema/book.schema';
import {NoDocumentForObjectIdError} from '../error/no-document-for-objectid.error';
import {RequiredPaginationArgs} from '../paginate/dto/required-pagination.args';
import {PaginateService, RelayConnection} from '../paginate/paginate.service';
import {Author} from './schema/author.schema';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectModel(Author.name)
    private readonly authorModel: Model<Author>,
    private readonly paginateService: PaginateService,
  ) {}

  id(author: Author): ObjectId {
    return author._id;
  }

  async all(): Promise<Author[]> {
    return this.authorModel.find();
  }

  async getById(id: ObjectId): Promise<Author> {
    const author = await this.authorModel.findById(id);

    if (author) return author;

    throw new NoDocumentForObjectIdError(Author.name, id);
  }

  async create(data: {name: string}): Promise<Author> {
    return this.authorModel.create({...data});
  }

  async books(
    author: Author,
    args: RequiredPaginationArgs,
  ): Promise<RelayConnection<BookDocument>> {
    const authorId = this.id(author);
    return this.paginateService.getConnectionFromMongooseModel<
      Author,
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
