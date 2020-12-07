import {Field, ObjectType} from '@nestjs/graphql';
import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document} from 'mongoose';

@Schema()
@ObjectType()
export class Author extends Document {
  @Prop()
  @Field(() => String)
  name!: string;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);
