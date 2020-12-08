import {Field, ObjectType} from '@nestjs/graphql';
import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document} from 'mongoose';

@Schema()
@ObjectType()
export class Series extends Document {
  @Prop()
  @Field(() => String)
  title!: string;

  @Prop()
  relatedBooks!: string[];
}

export const SeriesSchema = SchemaFactory.createForClass(Series);
