import {Parent, ResolveField, Resolver} from '@nestjs/graphql';
import {AuthorsService} from '../authors.service';
import {Author} from '../schema/author.schema';
import {BookAuthorsConnection} from './book-connection.entity';

@Resolver(() => BookAuthorsConnection)
export class BookAuthorsConnectionResolver {
  constructor(private authorService: AuthorsService) {}

  @ResolveField(() => Author)
  async author(@Parent() {id}: BookAuthorsConnection) {
    return this.authorService.getById(id);
  }
}
