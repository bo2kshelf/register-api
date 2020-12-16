import {ArgsType} from '@nestjs/graphql';
import {RequiredPaginationArgs} from '../../paginate/dto/required-pagination.argstype';

@ArgsType()
export class AuthorResolveBooksArgsType extends RequiredPaginationArgs {}
