import { ObjectAwareMixin } from './mixins/object-aware';
import { LeadAwareMixin } from './mixins/lead-aware';
import { CampaignMemberAwareMixin } from './mixins/campaign-member-aware';
import { AccountAwareMixin } from './mixins/account-aware';
import * as grpc from 'grpc';
import * as jsforce from 'jsforce';
import { ContactAwareMixin } from './mixins/contact-aware';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';
import { OpportunityAwareMixin } from './mixins/opportunity-aware';

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
    // Support non-UN/PW OAuth under the hood.
    if (auth.get('refreshToken').toString() && auth.get('accessToken').toString()) {
      this.client = new clientConstructor.Connection({
        oauth2: {
          clientId: auth.get('clientId').toString(),
          clientSecret: auth.get('clientSecret').toString(),
        },
        instanceUrl: auth.get('instanceUrl').toString(),
        accessToken: auth.get('accessToken').toString(),
        refreshToken: auth.get('refreshToken').toString(),
      });
      this.clientReady = new Promise((resolve, reject) => {
        this.client.oauth2.refreshToken(auth.get('refreshToken').toString(), (err, results) => {
          if (err) {
            return reject(`Auth Error: ${err.toString()}`);
          }
          this.client.accessToken = results.access_token;
          resolve(true);
        });
      });
      return;
    }

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
      this.clientReady = new Promise((resolve, reject) => {
        // Login using the username/password.
        this.client.login(
          auth.get('username').toString(),
          auth.get('password').toString(),
          (err, userInfo) => {
            if (err) {
              return reject(`Auth Error: ${err.toString()}`);
            }
            resolve(true);
          },
        );
      });
    }
  }
}

interface ClientWrapper extends ContactAwareMixin, AccountAwareMixin, OpportunityAwareMixin, CampaignMemberAwareMixin, LeadAwareMixin, ObjectAwareMixin {}
applyMixins(ClientWrapper, [ContactAwareMixin, AccountAwareMixin, OpportunityAwareMixin, CampaignMemberAwareMixin, LeadAwareMixin, ObjectAwareMixin]);

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
          // tslint:disable-next-line:max-line-length
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
    });
  });
}

export { ClientWrapper as ClientWrapper };
