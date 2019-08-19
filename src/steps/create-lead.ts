import { BaseStep, Field, StepInterface } from '../base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../proto/cog_pb';
import { Value } from 'google-protobuf/google/protobuf/struct_pb';

export class CreateLead extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Salesforce Lead';
  protected stepExpression: string = 'create a Salesforce Lead';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'lead',
    type: FieldDefinition.Type.MAP,
    description: 'An object representing a valid Lead object',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const lead: any = stepData.lead;
    let response: RunStepResponse = new RunStepResponse();

    try {
      response = await new Promise((resolve, reject) => {
        this.apiClient.sobject('Lead').create(lead, (err, result: any) => {
          if (err) {
            response.setOutcome(RunStepResponse.Outcome.FAILED);
            response.setMessageFormat('Failed to create lead: %s');
            response.setMessageArgsList([Value.fromJavaScript(err.message || err.name || '')]);
            resolve(response);
            return;
          }

          response.setOutcome(RunStepResponse.Outcome.PASSED);
          response.setMessageFormat('Successfully created Lead with ID %s');
          response.setMessageArgsList([Value.fromJavaScript(result.id)]);
          resolve(response);
        });
      });
    }catch (e) {
      const humanMessage = `${e.message} (${e.name || 'GenericError'})`;
      const messageArgs: any[] = [Value.fromJavaScript(humanMessage)];
      response.setOutcome(RunStepResponse.Outcome.ERROR);
      response.setMessageFormat('There was a problem creating the Lead: %s');
      response.setMessageArgsList(messageArgs);
    }

    return response;
  }

}

export { CreateLead as Step };
