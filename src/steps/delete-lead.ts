import { BaseStep, Field, StepInterface } from '../base-step';
import { Step, RunStepResponse, FieldDefinition } from '../proto/cog_pb';
import { Value } from 'google-protobuf/google/protobuf/struct_pb';
import { Record } from 'jsforce';

export class DeleteLead extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a Salesforce Lead';

  protected stepExpression: string = 'delete the (?<email>.+) Salesforce Lead';

  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'The e-mail address of the lead to be deleted.',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: any = stepData.email;
    let response: RunStepResponse = new RunStepResponse();

    try {
      response = await new Promise((resolve, reject) => {
        this.apiClient.sobject('Lead').findOne({ Email: email }, ['Id'], (err, record: Record) => {
          if (err) {
            reject(err);
            return;
          }

          if (!record) {
            reject(new Error(`No Lead found with email ${email}`));
            return;
          }

          try {
            this.apiClient.sobject('Lead').delete(record.Id, (err, result: any) => {
              if (err) {
                response.setOutcome(RunStepResponse.Outcome.FAILED);
                response.setMessageFormat('Failed to delete lead: %s');
                response.setMessageArgsList([Value.fromJavaScript(err.message || err.name || '')]);
                resolve(response);
                return;
              }

              response.setOutcome(RunStepResponse.Outcome.PASSED);
              response.setMessageFormat('Successfully deleted Lead %s (%s)');
              response.setMessageArgsList([
                Value.fromJavaScript(email),
                Value.fromJavaScript(record.Id),
              ]);
              resolve(response);
            });
          } catch (e) {
            reject(e);
          }
        });
      });
    } catch (e) {
      const humanMessage = `${e.message} (${e.name || 'GenericError'})`;
      const messageArgs: any[] = [Value.fromJavaScript(humanMessage)];
      response.setOutcome(RunStepResponse.Outcome.ERROR);
      response.setMessageFormat('There was a problem deleting the Lead: %s');
      response.setMessageArgsList(messageArgs);
      return response;
    }

    return response;
  }

}

export { DeleteLead as Step };
