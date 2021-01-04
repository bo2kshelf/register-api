import {ObjectType} from '@nestjs/graphql';
import {PaginatedFactory} from '../../paginate/paginated.factory';
import {BookEntity} from '../entity/book.entity';

@ObjectType()
export class PaginatedBookConnection extends PaginatedFactory(BookEntity) {}
