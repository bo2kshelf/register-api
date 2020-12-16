import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {ObjectId} from 'mongodb';
import {Model} from 'mongoose';
import {MongooseNotExistError} from '../error/mongoose-not-exist.error';
import {RequiredPaginationArgs} from '../paginate/dto/required-pagination.argstype';
import {getConnectionFromMongooseModel} from '../paginate/paginate';
import {Author} from './schema/author.schema';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectModel(Author.name)
    private readonly authorModel: Model<Author>,
  ) {}

  id(author: Author): ObjectId {
    return author._id;
  }

  async getById(id: ObjectId): Promise<Author> {
    const author = await this.authorModel.findById(id);

    if (author) return author;

    throw new MongooseNotExistError(Author.name, 'id', id.toHexString());
  }

  async create(data: {name: string}): Promise<Author> {
    return this.authorModel.create({...data});
  }

  async books(author: Author, args: RequiredPaginationArgs) {
    const authorId = this.id(author);
    return getConnectionFromMongooseModel(
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
