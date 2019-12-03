import { ClientWrapper } from '../client/client-wrapper';
import { StepDefinition, FieldDefinition, Step as PbStep, RunStepResponse } from '../proto/cog_pb';
import { Value } from 'google-protobuf/google/protobuf/struct_pb';
import * as moment from 'moment';

export interface StepInterface {
  getId(): string;
  getDefinition(): StepDefinition;
  executeStep(step: PbStep): Promise<RunStepResponse>;
}

export interface Field {
  field: string;
  type: FieldDefinition.Type;
  description: string;
  optionality?: number;
}

export abstract class BaseStep {

  protected stepName: string;
  protected stepExpression: string;
  protected stepType: StepDefinition.Type;
  protected expectedFields: Field[];

  operatorFailMessages = {
    be: 'Expected %s field to be %s, but it was actually %s',
    notbe: 'Expected %s field not to be %s, but it was also %s',
    contain: 'Expected %s field to contain %s, but it is not contained in %s',
    notcontain: 'Expected %s field not to contain %s, but it is contained in %s',
    begreaterthan: '%s field is expected to be greater than %s, but its value was %s',
    belessthan: '%s field is expected to be less than %s, but its value was %s',
  };

  operatorSuccessMessages = {
    be: 'The %s field was set to %s, as expected',
    notbe: 'The %s field was not set to %s, as expected',
    contain: 'The %s field contains %s, as expected',
    notcontain: 'The %s field does not contain %s, as expected',
    begreaterthan: 'The %s field was greater than %s, as expected',
    belessthan: 'The %s field was less than %s, as expected',
  };

  constructor(protected client: ClientWrapper) {}

  getId(): string {
    return this.constructor.name;
  }

  getDefinition(): StepDefinition {
    const stepDefinition: StepDefinition = new StepDefinition();
    stepDefinition.setStepId(this.getId());
    stepDefinition.setName(this.stepName);
    stepDefinition.setType(this.stepType);
    stepDefinition.setExpression(this.stepExpression);

    this.expectedFields.forEach((field: Field) => {
      const expectedField = new FieldDefinition();
      expectedField.setType(field.type);
      expectedField.setKey(field.field);
      expectedField.setDescription(field.description);
      stepDefinition.addExpectedFields(expectedField);

      if (field.hasOwnProperty('optionality')) {
        expectedField.setOptionality(field.optionality);
      } else {
        expectedField.setOptionality(FieldDefinition.Optionality.REQUIRED);
      }
    });

    return stepDefinition;
  }

  compare(operator: string, actualValue: string, value:string): boolean {
    const validOperators = ['be', 'not be', 'contain', 'not contain', 'be greater than', 'be less than'];
    const dateTimeFormat = /\d{4}-\d{2}-\d{2}(?:.?\d{2}:\d{2}:\d{2})?/;

    if (validOperators.includes(operator.toLowerCase())) {
      if (operator == 'be') {
        return actualValue == value;
      } else if (operator == 'not be') {
        return actualValue != value;
      } else if (operator == 'contain') {
        return actualValue.includes(value);
      } else if (operator == 'not contain') {
        return !actualValue.includes(value);
      } else if (operator == 'be greater than') {
        if (dateTimeFormat.test(actualValue) && dateTimeFormat.test(value)) {
          return moment(actualValue).isAfter(value);
        } else if (!isNaN(Number(actualValue)) && !isNaN(Number(value))) {
          return parseFloat(actualValue) > parseFloat(value);
        } else {
          throw new Error(`Couldn't check that ${actualValue} > ${value}. The ${operator} operator can only be used with numeric or date values.`);
        }
      } else if (operator == 'be less than') {
        if (dateTimeFormat.test(actualValue) && dateTimeFormat.test(value)) {
          return moment(actualValue).isBefore(value);
        } else if (!isNaN(Number(actualValue)) && !isNaN(Number(value))) {
          return parseFloat(actualValue) < parseFloat(value);
        } else {
          throw new Error(`Couldn't check that ${actualValue} < ${value}. The ${operator} operator can only be used with numeric or date values.`);
        }
      }
    } else {
      throw new Error(`${operator}" is an invalid operator. Please provide one of: ${validOperators.join(', ')}`);
    }
  }

  protected pass(message: string, messageArgs: any[] = []): RunStepResponse {
    const response = this.outcomelessResponse(message, messageArgs);
    response.setOutcome(RunStepResponse.Outcome.PASSED);
    return response;
  }

  protected fail(message: string, messageArgs: any[] = []): RunStepResponse {
    const response = this.outcomelessResponse(message, messageArgs);
    response.setOutcome(RunStepResponse.Outcome.FAILED);
    return response;
  }

  protected error(message: string, messageArgs: any[] = []): RunStepResponse {
    const response = this.outcomelessResponse(message, messageArgs);
    response.setOutcome(RunStepResponse.Outcome.ERROR);
    return response;
  }

  private outcomelessResponse(message: string, messageArgs: any[] = []): RunStepResponse {
    const response: RunStepResponse = new RunStepResponse();
    response.setMessageFormat(message);
    messageArgs.forEach((arg) => {
      response.addMessageArgs(Value.fromJavaScript(arg));
    });
    return response;
  }

}
