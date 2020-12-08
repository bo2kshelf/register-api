export class MongooseNotExistError extends Error {
  constructor(
    documentName: string,
    propertyName: string,
    property?: string | string[],
  ) {
    if (typeof property === 'string')
      super(
        `Not exist ${documentName} document for "${propertyName}:${property}"`,
      );
    else
      super(
        `Not exist ${documentName} documents for given propertiy "${propertyName}"`,
      );

    this.name = 'MongoNotExistError';
  }
}
