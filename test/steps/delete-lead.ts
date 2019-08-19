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
  let clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub.deleteLeadByEmail = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('DeleteLead');
    expect(stepDef.getName()).to.equal('Delete a Salesforce Lead');
    expect(stepDef.getExpression()).to.equal('delete the (?<email>.+) Salesforce Lead');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
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

  it('should respond with pass if lead is deleted', async () => {
    // Stub a response that matches expectations.
    const expectedUser: any = {id: 'abcxyz'};
    clientWrapperStub.deleteLeadByEmail.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {email: 'anything@example.com'};
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.deleteLeadByEmail).to.have.been.calledWith(expectations.email);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with error if delete method returns an error.', async () => {
    // Stub a response that matches expectations.
    const error: Error = new Error('Any error');
    clientWrapperStub.deleteLeadByEmail.rejects(error);

    // Set step data corresponding to expectations
    protoStep.setData(Struct.fromJavaScript({email: 'anything@example.com'}));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
