import { BaseStep, Field, StepInterface } from '../base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../proto/cog_pb';
import { Value } from 'google-protobuf/google/protobuf/struct_pb';
import { Record } from 'jsforce';

export class LeadFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Assert that a field on a Salesforce Lead has a given value';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>.+) field on Salesforce Lead (?<email>.+) should equal (?<expectedValue>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'The field name of the Lead',
  }, {
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'The email address of the Lead',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'The expected value of the field.',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const field: string = stepData.field;
    const expectedValue: string = stepData.expectedValue;
    const response: RunStepResponse = new RunStepResponse();
    let lead: Record;

    try {
      lead = await new Promise((resolve, reject) => {
        this.apiClient.sobject('Lead').findOne({ Email: email }, [field], (err, record: Record) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(record);
        });
      });
    } catch (e) {
      const humanMessage = `${e.message} (${e.name || 'GenericError'})`;
      const messageArgs: any[] = [Value.fromJavaScript(humanMessage)];
      response.setOutcome(RunStepResponse.Outcome.ERROR);
      response.setMessageFormat('There was a problem checking the Lead: %s');
      response.setMessageArgsList(messageArgs);
      return response;
    }

    if (!lead) {
      // If no results were found, return an error.
      response.setOutcome(RunStepResponse.Outcome.ERROR);
      response.setMessageFormat('No Lead found with email %s');
      response.addMessageArgs(Value.fromJavaScript(email));
    } else if (!lead.hasOwnProperty(field)) {
      // If the given field does not exist on the user, return an error.
      response.setOutcome(RunStepResponse.Outcome.ERROR);
      response.setMessageFormat('The %s field does not exist on Lead %s');
      response.addMessageArgs(Value.fromJavaScript(field));
      response.addMessageArgs(Value.fromJavaScript(email));
      /* tslint:disable-next-line:triple-equals */
    } else if (lead[field] == expectedValue) {
      // If the value of the field matches expectations, pass.
      response.setOutcome(RunStepResponse.Outcome.PASSED);
      response.setMessageFormat('The %s field was set to %s, as expected');
      response.addMessageArgs(Value.fromJavaScript(field));
      response.addMessageArgs(Value.fromJavaScript(lead[field]));
    } else {
      // If the value of the field does not match expectations, fail.
      response.setOutcome(RunStepResponse.Outcome.FAILED);
      response.setMessageFormat('Expected %s field to be %s, but it was actually %s');
      response.addMessageArgs(Value.fromJavaScript(field));
      response.addMessageArgs(Value.fromJavaScript(expectedValue));
      response.addMessageArgs(Value.fromJavaScript(lead[field]));
    }

    return response;
  }

}

export { LeadFieldEquals as Step };
