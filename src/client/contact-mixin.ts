import * as jsforce from 'jsforce';

type Constructor<T = {
  clientReady?: Promise<boolean>;
  client?: jsforce.Connection;
}> = new (...args: any[]) => T;

export interface ContactMixin {
  createContact(contact): Promise<any>;
  deleteContactByEmail(email: string): Promise<any>;
  findContactByEmail(email: string, field: string): Promise<any>;
}

// tslint:disable-next-line:function-name
export function ContactMixin<TBase extends Constructor>(base: TBase) {
  return class extends base {
    constructor(...args: any[]) {
      super(...args);
    }

    public async createContact(contact) {
      await this.clientReady;

      return new Promise((resolve, reject) => {
        try {
          this.client.sobject('Contact').create(contact, (err, result: any) => {
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

    public async deleteContactByEmail(email: string) {
      await this.clientReady;

      return new Promise(async (resolve, reject) => {
        try {
          const contact = await this.findContactByEmail(email, 'Id');
          if (!contact || !contact['Id']) {
            reject(new Error(`No Contact found with email ${email}`));
            return;
          }

          this.client.sobject('Contact').delete(contact['Id'], (err, result) => {
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

    public async findContactByEmail(email: string, field: string) {
      await this.clientReady;

      return new Promise((resolve, reject) => {
        try {
          this.client.sobject('Contact')
          .findOne({ Email: email }, [field], (err, record) => {
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
  };
}
