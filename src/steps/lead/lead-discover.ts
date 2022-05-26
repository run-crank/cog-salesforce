import { Field, ExpectedRecord } from './../../core/base-step';
/*tslint:disable:no-else-after-return*/

import { BaseStep, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class DiscoverLead extends BaseStep implements StepInterface {

  protected stepName: string = 'Discover fields on a Salesforce Lead';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'discover fields on salesforce lead (?<email>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Lead's email address",
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'lead',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.NUMERIC,
      description: "Lead's SalesForce ID",
    }, {
      field: 'CreatedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Lead's Created Date",
    }, {
      field: 'LastModifiedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Lead's Last Modified Date",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    let lead: Record<string, any>;

    try {
      lead = await this.client.findLeadByEmail(email, []);
    } catch (e) {
      return this.error('There was a problem checking the Lead: %s', [e.toString()]);
    }

    try {
      if (!lead) {
        // If no results were found, return an error.
        return this.fail('No Lead found with email %s', [email]);
      }

      const record = this.createRecord(lead);
      return this.pass('Successfully discovered fields on lead', [], [record]);

    } catch (e) {
      return this.error('There was a problem checking the Lead: %s', [e.message]);
    }
  }

  createRecord(lead: Record<string, any>) {
    delete lead.attributes;
    return this.keyValue('discoverLead', 'Discovered Lead', lead);
  }
}

export { DiscoverLead as Step };
