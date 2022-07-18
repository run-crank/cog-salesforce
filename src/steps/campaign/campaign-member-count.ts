/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';

export class CampaignMemberCountStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check the number on a Salesforce Campaign Member';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the number of members from salesforce campaign (?<campaignId>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'campaignId',
    type: FieldDefinition.Type.STRING,
    description: 'Campaign ID',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Expected field value',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'campaign',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'campaignId',
      type: FieldDefinition.Type.STRING,
      description: "Campaign's SalesForce ID",
    }, {
      field: 'campaignName',
      type: FieldDefinition.Type.STRING,
      description: "Campaign's Name",
    }, {
      field: 'campaignMemberCount',
      type: FieldDefinition.Type.STRING,
      description: "Campaign's Member Count",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const campaignId: string = stepData.campaignId;
    const operator: string = stepData.operator || 'be';
    const expectedValue: string = stepData.expectedValue;

    if ((expectedValue === null || expectedValue === undefined) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      const data = await this.client.findCampaignById(campaignId, ['Name', 'NumberOfLeads', 'NumberOfContacts']);

      if ((data === null || data === undefined) || (data && data.length === 0)) {
        return this.error('Campaign with Id %s does not exist', [
          campaignId,
        ]);
      }

      const totalMembers = +data.NumberOfLeads + +data.NumberOfContacts;

      const result = this.assert(operator, totalMembers.toString(), expectedValue, 'member count');

      const record = this.createRecord(campaignId, data.Name, totalMembers);

      result.message = result.message.replace(' field', '');
      return result.valid ? this.pass(result.message, [], [record])
        : this.fail(result.message, [], [record]);
    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was a problem checking the Campaign Member Count: %s', [e.message]);
    }
  }

  createRecord(id: string, name: string, count: number) {
    const record = {
      campaignId: id,
      campaignName: name,
      campaignMemberCount: count,
    };
    return this.keyValue('campaign', 'Checked Campaign Member Count', record);
  }
}

export { CampaignMemberCountStep as Step };
