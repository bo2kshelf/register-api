/* eslint-disable no-console */
import {NestFactory} from '@nestjs/core';
import {
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
} from '@nestjs/graphql';
import {writeFile} from 'fs';
import {printSchema} from 'graphql';
import * as path from 'path';
import {promisify} from 'util';
import {AuthorsResolver} from './authors/authors.resolver';
import {AuthorBookConnectionResolver} from './authors/connection/book.connection.resolver';
import {BooksResolver} from './books/books.resolver';
import {BookSeriesConnectionResolver} from './books/connection/series.connection.resolver';
import {SeriesResolver} from './series/series.resolver';

const schemaPath = path.resolve(process.cwd(), 'schema.graphqls');

(async () => {
  const app = await NestFactory.create(GraphQLSchemaBuilderModule);
  try {
    await app.init();
    await app
      .get(GraphQLSchemaFactory)
      .create([
        AuthorsResolver,
        AuthorBookConnectionResolver,
        BooksResolver,
        BookSeriesConnectionResolver,
        SeriesResolver,
      ])
      .then((schema) => printSchema(schema))
      .then((data) => promisify(writeFile)(schemaPath, data));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
})();
