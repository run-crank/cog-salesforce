import * as jsforce from 'jsforce';
import { ObjectAwareMixin } from './object-aware';

export class AccountAwareMixin extends ObjectAwareMixin {

  /**
   * Creates a Salesforce Account.
   *
   * @param {Record<string, any>} account - The Account record to create.
   */
  public async createAccount(account: Record<string, any>): Promise<jsforce.SuccessResult> {
    return this.createObject('Account', account);
  }

  /**
   * Retrieves a single Account record for a given id field and value.
   *
   * @param {String} idField - the field used to search/identify the account.
   * @param {String} identifier - the value of the id field to use when searching.
   */
  public async findAccountByIdentifier(idField: string, identifier: string): Promise<Record<string, any>[]> {
    return this.findObjectsbyFields('Account', {
      [idField]: identifier,
    });
  }

  /**
   * Deletes the Account associated with the a given id field and value.
   *
   * @param {String} idField - the field used to search/identify the account.
   * @param {String} identifier - the value of the id field to use when searching.
   */
  public async deleteAccountByIdentifier(idField: string, identifier: string): Promise<jsforce.SuccessResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const accounts = await this.findAccountByIdentifier(idField, identifier);
        if (accounts.length > 1) {
          reject(new Error(`More than one account matches ${idField} ${identifier}`));
          return;
        }

        if (!accounts || !accounts[0].Id) {
          reject(new Error(`No Account found with ${idField} ${identifier}`));
          return;
        }

        resolve(await this.deleteObjectById('Account', accounts[0].Id));
      } catch (e) {
        reject(e);
      }
    });
  }
}
