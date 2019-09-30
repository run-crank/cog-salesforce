import * as jsforce from 'jsforce';

type Constructor<T = {}> = new (...args: any[]) => T;

export interface BaseClientWrapper {
  client: jsforce.Connection;
  clientReady: Promise<boolean>;
}

// tslint:disable-next-line:function-name
export function BaseClientWrapper<TBase extends Constructor>(base: TBase) {
  return class extends base {
    protected client: jsforce.Connection;
    protected clientReady: Promise<boolean>;

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
  };
}
