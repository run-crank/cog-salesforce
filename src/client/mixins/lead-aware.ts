import * as jsforce from 'jsforce';
import { ObjectAwareMixin } from './object-aware';

export class LeadAwareMixin extends ObjectAwareMixin {

  /**
   * Creates a Salesforce Lead.
   *
   * @param {Record<string, any>} lead - The Lead record to create.
   */
  public async createLead(lead: Record<string, any>): Promise<jsforce.SuccessResult> {
    return this.createObject('Lead', lead);
  }

  /**
   * Retrieves a single Lead record for a given email address.
   *
   * @param {String} email - Email address of the Lead record to retrieve.
   */
  public async findLeadByEmail(email: string): Promise<Record<string, any>> {
    return this.findObjectByField('Lead', 'Email', email);
  }

  /**
   * Deletes the lead associated with the given email address.
   *
   * @param {String} email - The email address of the Lead to be deleted.
   */
  public async deleteLeadByEmail(email: string): Promise<jsforce.SuccessResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const lead = await this.findLeadByEmail(email);
        if (!lead || !lead.Id) {
          reject(new Error(`No Lead found with email ${email}`));
          return;
        }

        resolve(await this.deleteObjectById('Lead', lead.Id));
      } catch (e) {
        reject(e);
      }
    });
  }
}
