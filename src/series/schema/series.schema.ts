import {Directive, Field, ObjectType} from '@nestjs/graphql';
import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document} from 'mongoose';
import {
  SeriesBooksConnection,
  SeriesRelatedBooksConnection,
} from '../../books/connection/series.connection';

@Schema()
@ObjectType()
@Directive('@key(fields: "id")')
export class Series extends Document {
  @Prop()
  @Field(() => String)
  title!: string;

  @Prop(() => [SeriesBooksConnection])
  books!: SeriesBooksConnection[];

  @Prop(() => [SeriesRelatedBooksConnection])
  relatedBooks!: SeriesRelatedBooksConnection[];
}

export const SeriesSchema = SchemaFactory.createForClass(Series);
