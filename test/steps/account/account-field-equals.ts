import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

// tslint:disable-next-line:max-line-length
import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/account/account-field-equals';

chai.use(sinonChai);

describe('AccountFieldEqualsStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  const clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub.findAccountByIdentifier = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('AccountFieldEquals');
    expect(stepDef.getName()).to.equal('Check a field on a Salesforce Account');
    expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_]+) field on salesforce account with (?<idField>[a-zA-Z0-9_]+) (?<identifier>.+) should (?<operator>be set|not be set|be less than|be greater than|be|contain|not be|not contain) ?(?<expectedValue>.+)?');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Fields
    const idField: any = fields.filter(f => f.key === 'idField')[0];
    expect(idField.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(idField.type).to.equal(FieldDefinition.Type.STRING);

    const identifier: any = fields.filter(f => f.key === 'identifier')[0];
    expect(identifier.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(identifier.type).to.equal(FieldDefinition.Type.ANYSCALAR);

    const field: any = fields.filter(f => f.key === 'field')[0];
    expect(field.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(field.type).to.equal(FieldDefinition.Type.STRING);

    const operator: any = fields.filter(f => f.key === 'operator')[0];
    expect(operator.optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
    expect(operator.type).to.equal(FieldDefinition.Type.STRING);

    const expectedValue: any = fields.filter(f => f.key === 'expectedValue')[0];
    expect(expectedValue.optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
    expect(expectedValue.type).to.equal(FieldDefinition.Type.ANYSCALAR);
  });

  it('should respond with error if any errors or exceptions are caught', async () => {
    protoStep.setData(Struct.fromJavaScript({
      idField: 'idField',
      identifier: 'identifier',
      field: 'email',
      expectedValue: 'test@thisisjust.atomatest.com',
    }));
    clientWrapperStub.findAccountByIdentifier.throws();
    const response = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with pass if API client resolves expected data', async () => {
    // Stub a response that matches expectations.
    const sampleIdField = 'someIdField';
    const sampleIdentifier = 'someIdentifier';
    const sampleField = 'someField';
    const sampleValue = 'someValue';

    const expectedAccount = [
      {
        Id: 'someId',
        [sampleField]: sampleValue,
        Name: 'someName',
        attributes: { type: 'type', url: '/test/url' },
      },
    ];
    clientWrapperStub.findAccountByIdentifier.resolves(expectedAccount);

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: sampleIdField,
      identifier: sampleIdentifier,
      field: sampleField,
      expectedValue: sampleValue,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findAccountByIdentifier).to.have.been.calledWith(sampleIdField, sampleIdentifier);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with error when any exceptions/errors are caught', async () => {
    // Stub a response that matches expectations.
    const sampleIdField = 'someIdField';
    const sampleIdentifier = 'someIdentifier';
    const sampleField = 'someField';
    const sampleValue = 'someValue';

    const expectedAccount = undefined;
    clientWrapperStub.findAccountByIdentifier.resolves(expectedAccount);

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: sampleIdField,
      identifier: sampleIdentifier,
      field: sampleField,
      expectedValue: sampleValue,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with fail if API client resolves unexpected data', async () => {
    // Stub a response that matches expectations.
    const sampleIdField = 'someIdField';
    const sampleIdentifier = 'someIdentifier';
    const sampleField = 'someField';
    const sampleValue = 'someValue';

    const expectedAccount = [
      {
        Id: 'someId',
        [sampleField]: 'someOtherValue',
        Name: 'someName',
        attributes: { type: 'type', url: '/test/url' },
      },
    ];
    clientWrapperStub.findAccountByIdentifier.resolves(expectedAccount);

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: sampleIdField,
      identifier: sampleIdentifier,
      field: sampleField,
      expectedValue: sampleValue,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findAccountByIdentifier).to.have.been.calledWith(sampleIdField, sampleIdentifier);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with error if more than one account is retrieved', async () => {
    // Stub a response that matches expectations.
    const sampleIdField = 'someIdField';
    const sampleIdentifier = 'someIdentifier';
    const sampleField = 'someField';
    const sampleValue = 'someValue';
    const expectedResponseMessage = 'More than one account matches %s %s';

    const expectedAccount = [
      {
        Id: 'someId',
        [sampleField]: sampleValue,
        Name: 'someName',
        attributes: { type: 'type', url: '/test/url' },
      },
      {
        Id: 'someId',
        [sampleField]: sampleValue,
        Name: 'someName',
        attributes: { type: 'type', url: '/test/url' },
      },
    ];
    clientWrapperStub.findAccountByIdentifier.resolves(expectedAccount);

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: sampleIdField,
      identifier: sampleIdentifier,
      field: sampleField,
      expectedValue: sampleValue,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findAccountByIdentifier).to.have.been.calledWith(sampleIdField, sampleIdentifier);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error if account does not exist', async () => {
    // Stub a response that matches expectations.
    const sampleIdField = 'someIdField';
    const sampleIdentifier = 'someIdentifier';
    const sampleField = 'someField';
    const sampleValue = 'someValue';
    const expectedResponseMessage = 'No Account was found with %s %s';

    const expectedAccount = [];
    clientWrapperStub.findAccountByIdentifier.resolves(expectedAccount);

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: sampleIdField,
      identifier: sampleIdentifier,
      field: sampleField,
      expectedValue: sampleValue,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findAccountByIdentifier).to.have.been.calledWith(sampleIdField, sampleIdentifier);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error if field does not exist on the account', async () => {
    // Stub a response that matches expectations.
    const sampleIdField = 'someIdField';
    const sampleIdentifier = 'someIdentifier';
    const sampleField = 'someField';
    const sampleValue = 'someValue';
    const expectedResponseMessage = 'The %s field does not exist on Account %s';

    const expectedAccount = [
      {
        Id: 'someId',
        someOtherField: sampleValue,
        Name: 'someName',
        attributes: { type: 'type', url: '/test/url' },
      },
    ];
    clientWrapperStub.findAccountByIdentifier.resolves(expectedAccount);

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: sampleIdField,
      identifier: sampleIdentifier,
      field: sampleField,
      expectedValue: sampleValue,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findAccountByIdentifier).to.have.been.calledWith(sampleIdField, sampleIdentifier);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error if API client returns error', async () => {
    // Stub a response that matches expectations.
    const sampleIdField = 'someIdField';
    const sampleIdentifier = 'someIdentifier';
    const sampleField = 'someField';
    const sampleValue = 'someValue';
    const expectedResponseMessage = 'There was a problem checking the Account: %s';

    const error = new Error('An API Error');
    clientWrapperStub.findAccountByIdentifier.throws(error);

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: sampleIdField,
      identifier: sampleIdentifier,
      field: sampleField,
      expectedValue: sampleValue,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findAccountByIdentifier).to.have.been.calledWith(sampleIdField, sampleIdentifier);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error when inputing invalid operator', async () => {
    // Stub a response that matches expectations.
    const sampleIdField = 'someIdField';
    const sampleIdentifier = 'someIdentifier';
    const sampleField = 'someField';
    const sampleValue = 'someValue';
    const expectedResponseMessage = '%s Please provide one of: %s';

    const expectedAccount = [
      {
        Id: 'someId',
        [sampleField]: sampleValue,
        Name: 'someName',
        attributes: { type: 'type', url: '/test/url' },
      },
    ];
    clientWrapperStub.findAccountByIdentifier.resolves(expectedAccount);

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: sampleIdField,
      identifier: sampleIdentifier,
      field: sampleField,
      operator: 'invalidOperator',
      expectedValue: sampleValue,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findAccountByIdentifier).to.have.been.calledWith(sampleIdField, sampleIdentifier);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error when expected and actual values are compared having different types', async () => {
    // Stub a response that matches expectations.
    const sampleIdField = 'someIdField';
    const sampleIdentifier = 'someIdentifier';
    const sampleField = 'someField';
    const sampleValue = 300;

    const expectedAccount = [
      {
        Id: 'someId',
        [sampleField]: sampleValue,
        Name: 'someName',
        attributes: { type: 'type', url: '/test/url' },
      },
    ];
    clientWrapperStub.findAccountByIdentifier.resolves(expectedAccount);

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: sampleIdField,
      identifier: sampleIdentifier,
      field: sampleField,
      operator: 'be greater than',
      expectedValue: 'nonNumeric',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it("should respond with error when expectedValue is null when operator is not 'be set' or 'not be set'", async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = "The operator '%s' requires an expected value. Please provide one.";

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: 'anyIdField',
      identifier: 'anyIdentifier',
      field: 'anyField',
      operator: 'anyOperator',
      expectedValue: null,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it("should respond with error when expectedValue is not provided when operator is not 'be set' or 'not be set'", async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = "The operator '%s' requires an expected value. Please provide one.";

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: 'anyIdField',
      identifier: 'anyIdentifier',
      field: 'anyField',
      operator: 'anyOperator',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });
});
