import {ArgsType, Field, InputType} from '@nestjs/graphql';
import {RequiredPaginationArgs} from '../../paginate/dto/required-pagination.args';

@InputType()
export class AuthorRelatedSeriesArgsInclude {
  @Field({defaultValue: true})
  books!: boolean;

  @Field({defaultValue: false})
  relatedBooks!: boolean;
}

@ArgsType()
export class AuthorRelatedSeriesArgs extends RequiredPaginationArgs {
  @Field(() => AuthorRelatedSeriesArgsInclude, {
    nullable: true,
    defaultValue: {books: true, relatedBooks: false},
  })
  include!: AuthorRelatedSeriesArgsInclude;
}
