import * as jsforce from 'jsforce';

export class AccountAwareMixin {
  clientReady: Promise<boolean>;
  client: jsforce.Connection;

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
}
