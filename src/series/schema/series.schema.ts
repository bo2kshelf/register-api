import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document} from 'mongoose';
import {
  SeriesBooksConnection,
  SeriesRelatedBooksConnection,
} from '../../books/connection/series-connection.entity';

@Schema({collection: 'series'})
export class SeriesDocument extends Document {
  @Prop()
  title!: string;

  @Prop([SeriesBooksConnection])
  books!: SeriesBooksConnection[];

  @Prop([SeriesRelatedBooksConnection])
  relatedBooks!: SeriesRelatedBooksConnection[];
}

export const SeriesSchema = SchemaFactory.createForClass(SeriesDocument);
