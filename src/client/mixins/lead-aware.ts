import * as jsforce from 'jsforce';

export class LeadAwareMixin {
  clientReady: Promise<boolean>;
  client: jsforce.Connection;

  /**
   * Creates a Salesforce Lead.
   *
   * @param {Record<string, any>} lead - The Lead record to create.
   */
  public async createLead(lead: Record<string, any>): Promise<jsforce.SuccessResult> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.sobject('Lead').create(lead, (err, result: any) => {
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
   * Retrieves a single Lead record for a given email address.
   *
   * @param {String} email - Email address of the Lead record to retrieve.
   */
  public async findLeadByEmail(email: string): Promise<Record<string, any>> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.sobject('Lead').findOne({ Email: email }, (err, record) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(record);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Deletes the lead associated with the given email address.
   *
   * @param {String} email - The email address of the Lead to be deleted.
   */
  public async deleteLeadByEmail(email: string): Promise<jsforce.SuccessResult> {
    await this.clientReady;
    return new Promise(async (resolve, reject) => {
      try {
        const lead = await this.findLeadByEmail(email);
        if (!lead || !lead.Id) {
          reject(new Error(`No Lead found with email ${email}`));
          return;
        }

        this.client.sobject('Lead').delete(lead.Id, (err, result: any) => {
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
