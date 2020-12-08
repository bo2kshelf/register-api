import {Field, ObjectType} from '@nestjs/graphql';
import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document} from 'mongoose';
import {BookSeriesConnection} from '../../books/connection/series.connection';

@Schema()
@ObjectType()
export class Series extends Document {
  @Prop()
  @Field(() => String)
  title!: string;

  @Prop()
  books!: BookSeriesConnection[];

  @Prop()
  relatedBooks!: string[];
}

export const SeriesSchema = SchemaFactory.createForClass(Series);
