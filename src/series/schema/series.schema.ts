import {Directive, Field, ObjectType} from '@nestjs/graphql';
import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document} from 'mongoose';
import {
  BookSeriesConnection,
  BookSeriesRelatedBookConnection,
} from '../../books/connection/series.connection';

@Schema()
@ObjectType()
@Directive('@key(fields: "id")')
export class Series extends Document {
  @Prop()
  @Field(() => String)
  title!: string;

  @Prop(() => [BookSeriesConnection])
  books!: BookSeriesConnection[];

  @Prop(() => [BookSeriesRelatedBookConnection])
  relatedBooks!: BookSeriesRelatedBookConnection[];
}

export const SeriesSchema = SchemaFactory.createForClass(Series);
