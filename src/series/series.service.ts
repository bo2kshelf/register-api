import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import {Book} from '../books/schema/book.schema';
import {MongooseNotExistError} from '../error/mongoose-not-exist.error';
import {Series} from './schema/series.schema';

@Injectable()
export class SeriesService {
  constructor(
    @InjectModel(Series.name)
    private readonly seriesModel: Model<Series>,

    @InjectModel(Book.name)
    private readonly bookModel: Model<Book>,
  ) {}

  id(series: Series): string {
    return series._id;
  }

  async getById(id: string): Promise<Series> {
    const series = await this.seriesModel.findById(id);

    if (series) return series;

    throw new Error(`Series associated with ID "${id}" doesn't exist.`);
  }

  async create({
    relatedBooks = [],
    ...data
  }: {
    title: string;
    relatedBooks?: string[];
  }): Promise<Series> {
    if (new Set(relatedBooks).size !== relatedBooks.length)
      throw new Error(`Duplicate in the property "relatedBooks"`);

    if (
      (await this.bookModel.find({_id: relatedBooks})).length !==
      relatedBooks.length
    )
      throw new MongooseNotExistError(Book.name, 'relatedBooks');

    return this.seriesModel.create({relatedBooks, ...data});
  }
}
