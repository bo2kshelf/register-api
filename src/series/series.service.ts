import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import {Series} from './schema/series.schema';

@Injectable()
export class SeriesService {
  constructor(
    @InjectModel(Series.name)
    private readonly seriesModel: Model<Series>,
  ) {}

  id(series: Series): string {
    return series._id;
  }

  async getById(id: string): Promise<Series> {
    const series = await this.seriesModel.findById(id);

    if (series) return series;

    throw new Error(`Series associated with ID "${id}" doesn't exist.`);
  }

  async create(data: {title: string}): Promise<Series> {
    return this.seriesModel.create({...data});
  }
}
