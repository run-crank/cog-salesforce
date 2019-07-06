import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../src/proto/cog_pb';
import { Step } from '../../src/steps/lead-field-equals';

chai.use(sinonChai);

describe('LeadFieldEqualsStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let apiClientStub: any;
  let sobjectStub: any;

  beforeEach(() => {
    sobjectStub = {findOne: sinon.stub()};
    apiClientStub = {sobject: sinon.stub()};
    apiClientStub.sobject.returns(sobjectStub);
    stepUnderTest = new Step(apiClientStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('LeadFieldEquals');
    expect(stepDef.getName()).to.equal('Assert that a field on a Salesforce Lead has a given value');
    expect(stepDef.getExpression()).to.equal('the (?<field>.+) field on Salesforce Lead (?<email>.+) should equal (?<expectedValue>.+)');
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Field field
    const field: any = fields.filter(f => f.key === 'field')[0];
    expect(field.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(field.type).to.equal(FieldDefinition.Type.STRING);

    // Email field
    const email: any = fields.filter(f => f.key === 'email')[0];
    expect(email.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(email.type).to.equal(FieldDefinition.Type.EMAIL);

    // Expected Value field
    const expectedValue: any = fields.filter(f => f.key === 'expectedValue')[0];
    expect(expectedValue.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(expectedValue.type).to.equal(FieldDefinition.Type.ANYSCALAR);
  });

  it('should respond with pass if API client resolves expected data', async () => {
    // Stub a response that matches expectations.
    const expectedUser: any = {someField: 'Expected Value'};
    sobjectStub.findOne.callsArgWith(2, null, expectedUser)

    // Set step data corresponding to expectations
    const expectations: any = {
      field: 'someField',
      expectedValue: expectedUser.someField,
      email: 'anything@example.com',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(apiClientStub.sobject).to.have.been.calledWith('Lead');
    expect(sobjectStub.findOne).to.have.been.calledWith({Email: expectations.email}, [expectations.field]);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with fail if API client resolves unexpected data', async () => {
    // Stub a response that does not match expectations.
    const expectedUser: any = {someField: 'Expected Value'};
    sobjectStub.findOne.callsArgWith(2, null, expectedUser)

    // Set step data corresponding to expectations
    protoStep.setData(Struct.fromJavaScript({
      field: 'someField',
      expectedValue: `Not ${expectedUser.someField}`,
      email: 'anything@example.com',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with error if API client resolves no results', async () => {
    // Stub a response with no results in the body.
    sobjectStub.findOne.callsArgWith(2, null, null);

    protoStep.setData(Struct.fromJavaScript({
      field: 'anyField',
      expectedValue: 'Any Value',
      email: 'anything@example.com',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error if resolved user does not contain given field', async () => {
    // Stub a response with valid response, but no expected field.
    const expectedUser: any = {someField: 'Expected Value'};
    sobjectStub.findOne.callsArgWith(2, null, expectedUser)

    protoStep.setData(Struct.fromJavaScript({
      field: 'someOtherField',
      expectedValue: 'Any Value',
      email: 'anything@example.com',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error if API client returns error', async () => {
    // Stub a response that responds with error.
    const error: Error = new Error('Any error');
    sobjectStub.findOne.callsArgWith(2, error);

    protoStep.setData(Struct.fromJavaScript({
      field: 'someOtherField',
      expectedValue: 'Any Value',
      email: 'anything@example.com',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error if API client throws error', async () => {
    // Stub a response that throws any exception.
    sobjectStub.findOne.throws();
    protoStep.setData(Struct.fromJavaScript({}));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
