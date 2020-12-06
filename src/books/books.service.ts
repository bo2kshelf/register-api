import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import {Book} from './schema/book.schema';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name)
    private readonly bookModel: Model<Book>,
  ) {}

  id(book: Book): string {
    return book._id;
  }

  async getById(id: string): Promise<Book> {
    const book = await this.bookModel.findById(id);

    if (book) return book;

    throw new Error(`Book associated with ID "${id}" doesn't exist.`);
  }

  async create(data: {title: string; isbn?: string}): Promise<Book> {
    return this.bookModel.create({...data});
  }
}
