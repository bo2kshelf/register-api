import {ArgsType} from '@nestjs/graphql';
import {RequiredPaginationArgs} from '../../paginate/dto/required-pagination.args';

@ArgsType()
export class AuthorResolveBooksArgs extends RequiredPaginationArgs {}
