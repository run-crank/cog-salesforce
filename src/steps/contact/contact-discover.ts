import { Field, ExpectedRecord } from './../../core/base-step';
/*tslint:disable:no-else-after-return*/

import { BaseStep, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class DiscoverContact extends BaseStep implements StepInterface {

  protected stepName: string = 'Discover fields on a Salesforce Contact';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'discover fields on salesforce contact (?<email>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Contact's email address",
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'contact',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.NUMERIC,
      description: "Contact's SalesForce ID",
    }, {
      field: 'CreatedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Contact's Created Date",
    }, {
      field: 'LastModifiedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Contact's Last Modified Date",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    let contact: Record<string, any>;

    try {
      contact = await this.client.findContactByEmail(email, []);
    } catch (e) {
      return this.error('There was a problem checking the Contact: %s', [e.toString()]);
    }

    try {
      if (!contact) {
        // If no results were found, return an error.
        return this.fail('No Contact found with email %s', [email]);
      }

      const record = this.createRecord(contact);
      return this.pass('Successfully discovered fields on contact', [], [record]);

    } catch (e) {
      return this.error('There was a problem checking the Contact: %s', [e.message]);
    }
  }

  createRecord(contact: Record<string, any>) {
    delete contact.attributes;
    return this.keyValue('discoverContact', 'Discovered Contact', contact);
  }
}

export { DiscoverContact as Step };
