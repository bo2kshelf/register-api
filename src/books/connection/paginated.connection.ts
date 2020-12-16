import {ObjectType} from '@nestjs/graphql';
import {Paginated} from '../../paginate/paginate';
import {Book} from '../schema/book.schema';

@ObjectType()
export class PaginatedBookConnection extends Paginated(Book) {}
