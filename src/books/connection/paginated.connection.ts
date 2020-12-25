import {ObjectType} from '@nestjs/graphql';
import {PaginatedFactory} from '../../paginate/paginated.factory';
import {Book} from '../schema/book.schema';

@ObjectType()
export class PaginatedBookConnection extends PaginatedFactory(Book) {}
