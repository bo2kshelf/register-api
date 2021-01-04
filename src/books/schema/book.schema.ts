import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {ObjectId} from 'mongodb';
import {Document} from 'mongoose';

@Schema()
export class BookDocument extends Document {
  @Prop()
  title!: string;

  @Prop({required: false})
  isbn?: string;

  @Prop()
  authors!: {id: ObjectId; roles?: string[]}[];
}

export const BookSchema = SchemaFactory.createForClass(BookDocument);
