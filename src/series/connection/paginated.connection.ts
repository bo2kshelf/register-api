import {ObjectType} from '@nestjs/graphql';
import {PaginatedFactory} from '../../paginate/paginated.factory';
import {SeriesEntity} from '../entity/series.entity';

@ObjectType()
export class PaginatedSeriesConnection extends PaginatedFactory(SeriesEntity) {}
