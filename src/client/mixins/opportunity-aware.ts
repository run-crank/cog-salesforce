import * as jsforce from 'jsforce';
import { ObjectAwareMixin } from './object-aware';

export class OpportunityAwareMixin extends ObjectAwareMixin {
  clientReady: Promise<boolean>;
  client: jsforce.Connection;

  /**
   * Creates a Salesforce Opportunity.
   *
   * @param {Record<string, any>} opportunity - The Oppurtunity record to create.
   */
  public async createOpportunity(opportunity: Record<string, any>): Promise<jsforce.SuccessResult> {
    return this.createObject('Opportunity', opportunity);
  }

  /**
   * Retrieves a single Opportunity record for a given id field and value.
   *
   * @param {String} idField - the field used to search/identify the opportunity.
   * @param {String} identifier - the value of the id field to use when searching.
   * @param {String} alwaysRetrieve - an optional list of fields that should
   *   always be retrieved when finding opportunities.
   */
  public async findOpportunityByIdentifier(idField: string, identifier: string, alwaysRetrieve: string[] = [], mayGenerateBadRequest: Boolean = false): Promise<Record<string, any>[]> {
    return this.findObjectsbyFields('Opportunity', { [idField]: identifier }, alwaysRetrieve, mayGenerateBadRequest);
  }

  /**
   * Deletes the Opportunity associated with the a given id field and value.
   *
   * @param {String} idField - the field used to search/identify the opportunity.
   * @param {String} identifier - the value of the id field to use when searching.
   */
  public async deleteOpportunityByIdentifier(idField: string, identifier: string): Promise<Record<string, any>> {
    return new Promise(async (resolve, reject) => {
      try {
        const opps = await this.findOpportunityByIdentifier(idField, identifier);
        if (opps.length > 1) {
          reject(new Error(`More than one opportunity matches ${idField} ${identifier}`));
          return;
        }

        if (!opps[0] || !opps[0].Id) {
          reject(new Error(`No Opportunity found with ${idField} ${identifier}`));
          return;
        }

        resolve(await this.deleteObjectById('Opportunity', opps[0].Id));
      } catch (e) {
        reject(e);
      }
    });
  }
}
