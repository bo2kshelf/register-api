import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document} from 'mongoose';

@Schema()
export class AuthorDocument extends Document {
  @Prop()
  name!: string;
}

export const AuthorSchema = SchemaFactory.createForClass(AuthorDocument);
