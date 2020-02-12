import * as jsforce from 'jsforce';

export class ContactAwareMixin {
  clientReady: Promise<boolean>;
  client: jsforce.Connection;

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
        const contact = await this.findContactByEmail(email);
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

  public async findContactByEmail(email: string) {
    await this.clientReady;

    return new Promise((resolve, reject) => {
      try {
        this.client.sobject('Contact')
          .findOne({ Email: email }, (err, record) => {
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
