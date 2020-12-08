import {Parent, ResolveField, Resolver} from '@nestjs/graphql';
import {AuthorsService} from '../authors.service';
import {Author} from '../schema/author.schema';
import {AuthorBookConnection} from './book.connection';

@Resolver(() => AuthorBookConnection)
export class AuthorBookConnectionResolver {
  constructor(private authorService: AuthorsService) {}

  @ResolveField(() => Author)
  async author(@Parent() {id}: AuthorBookConnection) {
    return this.authorService.getById(id);
  }
}
