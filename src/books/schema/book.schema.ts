import {Field, ObjectType} from '@nestjs/graphql';
import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {ObjectId} from 'mongodb';
import {Document} from 'mongoose';

@Schema()
@ObjectType()
export class Book extends Document {
  @Prop()
  @Field(() => String)
  title!: string;

  @Prop({required: false})
  @Field(() => String, {nullable: true})
  isbn?: string;

  @Prop()
  authors!: {id: ObjectId; roles?: string[]}[];
}

export const BookSchema = SchemaFactory.createForClass(Book);
