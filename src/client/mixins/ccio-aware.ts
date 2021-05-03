import * as jsforce from 'jsforce';
import { ObjectAwareMixin } from './object-aware';

export class CCIOAwareMixin extends ObjectAwareMixin {

  /**
   * Retrieves a single Lead record for a given email address.
   *
   * @param {String} id - id of the Lead associated with the ccio record to retrieve.
   * @param {String[]} alwaysRetrieveFields - An optional array of fields that
   *   should always be retrieved.
   */
  public async findCCIOById(id: string, alwaysRetrieveFields: string[] = []): Promise<Record<string, any>> {
    return this.findObjectByField('LeanData__CC_Inserted_Object__c', 'Id', id, alwaysRetrieveFields);
  }
}
