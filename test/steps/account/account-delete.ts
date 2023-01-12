import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

// tslint:disable-next-line:max-line-length
import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/account/account-delete';

chai.use(sinonChai);

describe('DeleteAccountStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub = sinon.stub();
    clientWrapperStub.deleteAccountByIdentifier = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('DeleteAccount');
    expect(stepDef.getName()).to.equal('Delete a Salesforce account');
    expect(stepDef.getExpression()).to.equal('delete the salesforce account with (?<field>[a-zA-Z0-9_]+) (?<identifier>.+)');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Fields
    const field: any = fields.filter(f => f.key === 'field')[0];
    expect(field.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(field.type).to.equal(FieldDefinition.Type.STRING);
    const indentifier: any = fields.filter(f => f.key === 'identifier')[0];
    expect(indentifier.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(indentifier.type).to.equal(FieldDefinition.Type.ANYSCALAR);
  });

  it('should respond with pass if account is deleted', async () => {
    // Stub a response that matches expectations.
    const sampleAccount: any = {
      name: 'sampleName',
      id: 'sampleId',
    };
    clientWrapperStub.deleteAccountByIdentifier.resolves(sampleAccount);

    // Set step data corresponding to expectations
    const expectations: any = {
      field: 'anyField',
      identifier: 'anyValue',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.deleteAccountByIdentifier).to.have.been.calledWith(expectations.field, expectations.identifier);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with error if delete method returns an error.', async () => {
    // Stub a response that matches expectations.
    const error: Error = new Error('Any error');
    clientWrapperStub.deleteAccountByIdentifier.rejects(error);

    // Set step data corresponding to expectations
    const expectations: any = {
      field: 'anyField',
      identifier: 'anyValue',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
