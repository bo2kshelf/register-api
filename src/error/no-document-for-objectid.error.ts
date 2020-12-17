import {ObjectId} from 'mongodb';

export class NoDocumentForObjectIdError extends Error {
  constructor(documentName: string, objectId: ObjectId) {
    super(
      `Not exist ${documentName} document for "id:${objectId.toHexString()}"`,
    );
    this.name = 'NoDocumentForObjectIdError';
  }
}
