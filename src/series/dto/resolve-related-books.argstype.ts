import {ArgsType} from '@nestjs/graphql';
import {RequiredPaginationArgs} from '../../paginate/dto/required-pagination.argstype';

@ArgsType()
export class SeriesResolveRelatedBooksArgsType extends RequiredPaginationArgs {}
