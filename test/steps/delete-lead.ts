import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../src/proto/cog_pb';
import { Step } from '../../src/steps/delete-lead';

chai.use(sinonChai);

describe('DeleteLeadStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let apiClientStub: any;
  let sobjectStub: any;

  beforeEach(() => {
    sobjectStub = {
      findOne: sinon.stub(),
      delete: sinon.stub(),
    };
    apiClientStub = {sobject: sinon.stub()};
    apiClientStub.sobject.returns(sobjectStub);
    stepUnderTest = new Step(apiClientStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('DeleteLead');
    expect(stepDef.getName()).to.equal('Delete a Salesforce Lead');
    expect(stepDef.getExpression()).to.equal('delete the (?<email>.+) Salesforce Lead');
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Email field
    const email: any = fields.filter(f => f.key === 'email')[0];
    expect(email.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(email.type).to.equal(FieldDefinition.Type.EMAIL);
  });

  it('should respond with pass if lead is deleted.', async () => {
    // Stub a response that matches expectations.
    const expectedUser: any = {Id: 'abcxyz'};
    sobjectStub.findOne.callsArgWith(2, null, expectedUser);
    sobjectStub.delete.callsArgWith(1, null, {});

    // Set step data corresponding to expectations
    const expectations: any = {email: 'anything@example.com'};
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(apiClientStub.sobject).to.have.been.calledWith('Lead');
    expect(sobjectStub.findOne).to.have.been.calledWith({Email: expectations.email}, ['Id']);
    expect(sobjectStub.delete).to.have.been.calledWith(expectedUser.Id);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with fail if delete method returns an error.', async () => {
    // Stub a response that matches expectations.
    const expectedUser: any = {Id: 'abcxyz'};
    const error: Error = new Error('Any error');
    sobjectStub.findOne.callsArgWith(2, null, expectedUser);
    sobjectStub.delete.callsArgWith(1, error);

    // Set step data corresponding to expectations
    protoStep.setData(Struct.fromJavaScript({email: 'anything@example.com'}));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with error if no corresponding lead is found', async () => {
    // Stub a response that does not match expectations.
    sobjectStub.findOne.callsArgWith(2, null);

    // Set step data corresponding to expectations
    protoStep.setData(Struct.fromJavaScript({email: 'anything@example.com'}));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error if findOne method returns an error', async () => {
    // Stub a response that does not match expectations.
    const error: Error = new Error('Any error');
    sobjectStub.findOne.callsArgWith(2, error)

    // Set step data corresponding to expectations
    protoStep.setData(Struct.fromJavaScript({email: 'anything@example.com'}));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error if findOne method throws an error', async () => {
    // Stub a response with no results in the body.
    sobjectStub.findOne.throws()

    protoStep.setData(Struct.fromJavaScript({email: 'anything@example.com'}));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error if delete method throws an error', async () => {
    // Stub a response with valid response, but no expected field.
    const expectedUser: any = {someField: 'Expected Value'};
    sobjectStub.findOne.callsArgWith(2, null, expectedUser)
    sobjectStub.delete.throws();

    protoStep.setData(Struct.fromJavaScript({email: 'anything@example.com'}));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
