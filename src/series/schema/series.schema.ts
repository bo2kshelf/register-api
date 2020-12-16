import {Field, ObjectType} from '@nestjs/graphql';
import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {ObjectId} from 'mongodb';
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

  @Prop(() => ObjectId)
  relatedBooks!: ObjectId[];
}

export const SeriesSchema = SchemaFactory.createForClass(Series);
