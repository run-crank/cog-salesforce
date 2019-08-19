import * as grpc from 'grpc';
import * as jsforce from 'jsforce';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';

export class ClientWrapper {

  public static expectedAuthFields: Field[] = [{
    field: 'instanceUrl',
    type: FieldDefinition.Type.URL,
    description: 'Your Salesforce server URL (e.g. https://na1.salesforce.com)',
  }, {
    field: 'accessToken',
    type: FieldDefinition.Type.STRING,
    description: 'Your Salesforce OAuth2 access token.',
  }];

  private client: jsforce.Connection;

  constructor (auth: grpc.Metadata, clientConstructor = jsforce) {
    this.client = new clientConstructor.Connection({
      instanceUrl: auth.get('instanceUrl').toString(),
      accessToken: auth.get('accessToken').toString(),
    });
  }

  /**
   * Creates a Salesforce Lead.
   *
   * @param {Record<string, any>} lead - The Lead record to create.
   */
  public async createLead(lead: Record<string, any>): Promise<jsforce.SuccessResult> {
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
   * Retrieves a single Lead record for a given email address, including the
   * provided field.
   *
   * @param {String} email - Email address of the Lead record to retrieve.
   * @param {String} field - Lead field to include on the returned record.
   */
  public async findLeadByEmail(email: string, field: string): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      try {
        this.client.sobject('Lead').findOne({ Email: email }, [field], (err, record) => {
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
    return new Promise(async (resolve, reject) => {
      try {
        const lead = await this.findLeadByEmail(email, 'Id');
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
