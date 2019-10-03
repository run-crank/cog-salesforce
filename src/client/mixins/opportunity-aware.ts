import * as jsforce from 'jsforce';

export class OpportunityAwareMixin {
  clientReady: Promise<boolean>;
  client: jsforce.Connection;

  /**
   * Creates a Salesforce Opportunity.
   *
   * @param {Record<string, any>} opportunity - The Oppurtunity record to create.
   */
  public async createOpportunity(opportunity: Record<string, any>): Promise<jsforce.SuccessResult> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.sobject('Opportunity').create(opportunity, (err, result: any) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(result);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Retrieves a single Opportunity record for a given id field and value, including the
   * provided field.
   *
   * @param {String} idField - the field used to search/identify the opportunity.
   * @param {String} identifier - the value of the id field to use when searching.
   * @param {String} field - the name of the field to check.
   */
  public async findOpportunityByIdentifier(idField: string, identifier: string, field: string): Promise<Record<string, any>[]> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.sobject('Opportunity').find({ [idField]: identifier }, [field], (err, records) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(records);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Deletes the Opportunity associated with the a given id field and value.
   *
   * @param {String} idField - the field used to search/identify the opportunity.
   * @param {String} identifier - the value of the id field to use when searching.
   */
  public async deleteOpportunityByIdentifier(idField: string, identifier: string): Promise<jsforce.SuccessResult> {
    await this.clientReady;
    return new Promise(async (resolve, reject) => {
      try {
        const lead = await this.findOpportunityByIdentifier(idField, identifier, 'Id');
        if (lead.length > 1) {
          reject(new Error(`More than one opportunity matches ${idField} ${identifier}`));
          return;
        }

        if (!lead || !lead[0].Id) {
          reject(new Error(`No Account found with ${idField} ${identifier}`));
          return;
        }

        this.client.sobject('Opportunity').delete(lead[0].Id, (err, result: any) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(result);
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
