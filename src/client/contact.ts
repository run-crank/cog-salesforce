import * as jsforce from 'jsforce';

type Constructor<T = {}> = new (...args: any[]) => T;

export interface Contact {
  createContact(contact): Promise<any>;
  deleteContactByEmail(email: string): Promise<any>;
  findContactByEmail(email: string, field: string): Promise<any>;
}

// tslint:disable-next-line:function-name
export function Contact<TBase extends Constructor>(base: TBase) {
  return class extends base {
    private client: jsforce.Connection;
    private clientReady: Promise<boolean>;

    constructor(...args: any[]) {
      super(...args);
      const auth = args[0];
      const clientConstructor = jsforce;

      if (auth.get('clientSecret') && auth.get('password')) {
        this.client = new clientConstructor.Connection({
          oauth2: {
            loginUrl: auth.get('instanceUrl').toString(),
            clientId: auth.get('clientId').toString(),
            clientSecret: auth.get('clientSecret').toString(),
          },
        });

        this.clientReady = new Promise((resolve) => {
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
          this.client.sobject('Contact').findOne({ Email: email }, [field], (err, record) => {
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
