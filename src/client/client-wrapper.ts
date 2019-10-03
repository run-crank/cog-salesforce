import * as grpc from 'grpc';
import * as jsforce from 'jsforce';
import { ContactAwareMixin } from './mixins/contact-aware';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';

class ClientWrapper {

  // For now, only support Username and Password Login (OAuth2 Resource Owner Password Credential)
  public static expectedAuthFields: Field[] = [{
    field: 'instanceUrl',
    type: FieldDefinition.Type.URL,
    description: 'Login/instance URL (e.g. https://na1.salesforce.com)',
  }, {
    field: 'clientId',
    type: FieldDefinition.Type.STRING,
    description: 'OAuth2 Client ID',
  }, {
    field: 'clientSecret',
    type: FieldDefinition.Type.STRING,
    description: 'OAuth2 Client Secret',
  }, {
    field: 'username',
    type: FieldDefinition.Type.STRING,
    description: 'Username',
  }, {
    field: 'password',
    type: FieldDefinition.Type.STRING,
    description: 'Password',
  }];

  public client: jsforce.Connection;
  public clientReady: Promise<boolean>;

  constructor (auth: grpc.Metadata, clientConstructor = jsforce) {
    // User/Password OAuth2 Resource Owner Credential Flow
    if (auth.get('clientSecret') && auth.get('password')) {
      // Construct the connection.
      this.client = new clientConstructor.Connection({
        oauth2: {
          loginUrl: auth.get('instanceUrl').toString(),
          clientId: auth.get('clientId').toString(),
          clientSecret: auth.get('clientSecret').toString(),
        },
      });

      // Wraps the async login function in a way that ensures steps can wait
      // until the client is actually authenticated.
      this.clientReady = new Promise((resolve) => {
        // Login using the username/password.
        this.client.login(
          auth.get('username').toString(),
          auth.get('password').toString(),
          (err, userInfo) => {
            resolve(true);
          },
        );
      });
    }
  }

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
   * Retrieves a single Lead record for a given email address, including the
   * provided field.
   *
   * @param {String} email - Email address of the Lead record to retrieve.
   * @param {String} field - Lead field to include on the returned record.
   */
  public async findLeadByEmail(email: string, field: string): Promise<Record<string, any>> {
    await this.clientReady;
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
    await this.clientReady;
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

  /**
   * Creates a Salesforce Account.
   *
   * @param {Record<string, any>} account - The Account record to create.
   */
  public async createAccount(account: Record<string, any>): Promise<jsforce.SuccessResult> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.sobject('Account').create(account, (err, result: any) => {
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
   * Retrieves a single Account record for a given id field and value, including the
   * provided field.
   *
   * @param {String} idField - the field used to search/identify the account.
   * @param {String} identifier - the value of the id field to use when searching.
   * @param {String} field - the name of the field to check.
   */
  public async findAccountByIdentifier(idField: string, identifier: string, field: string): Promise<Record<string, any>[]> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.sobject('Account').find({ [idField]: identifier }, [field], (err, records) => {
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
   * Deletes the Account associated with the a given id field and value.
   *
   * @param {String} idField - the field used to search/identify the account.
   * @param {String} identifier - the value of the id field to use when searching.
   */
  public async deleteAccountByIdentifier(idField: string, identifier: string): Promise<jsforce.SuccessResult> {
    await this.clientReady;
    return new Promise(async (resolve, reject) => {
      try {
        const lead = await this.findAccountByIdentifier(idField, identifier, 'Id');
        if (lead.length > 1) {
          reject(new Error(`More than one account matches ${idField} ${identifier}`));
          return;
        }

        if (!lead || !lead[0].Id) {
          reject(new Error(`No Account found with ${idField} ${identifier}`));
          return;
        }

        this.client.sobject('Account').delete(lead[0].Id, (err, result: any) => {
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

  /**
   * Retrieves a single CampaignMember record for a given email address, including the
   * provided field.
   *
   * @param {String} email - Email address of the CampaignMember record to retrieve.
   * @param {String} fields - CampaignMember fields to include on the returned record.
   */
  public async findCampaignMemberByEmailAndCampaignId(email: string, campaignId: string, fields: string[]): Promise<Record<string, any>> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.sobject('CampaignMember').findOne({ Email: email, CampaignId: campaignId }, fields, (err, record) => {
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
}

interface ClientWrapper extends ContactAwareMixin {}
applyMixins(ClientWrapper, [ContactAwareMixin]);

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
          // tslint:disable-next-line:max-line-length
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
    });
  });
}

export { ClientWrapper as ClientWrapper };
