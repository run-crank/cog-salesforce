import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

// tslint:disable-next-line:max-line-length
import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/account/account-create';

chai.use(sinonChai);

describe('CreateAccountStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub = sinon.stub();
    clientWrapperStub.createAccount = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('CreateAccount');
    expect(stepDef.getName()).to.equal('Create a Salesforce Account');
    expect(stepDef.getExpression()).to.equal('create a salesforce account');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Account field
    const account: any = fields.filter(f => f.key === 'account')[0];
    expect(account.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(account.type).to.equal(FieldDefinition.Type.MAP);
  });

  it('should respond with pass if account is created.', async () => {
    // Stub a response that matches expectations.
    const sampleAccount = {
      account: {
        Name: 'sampleName',
        id: 'sampleId',
      },
    };
    const expectedResponse = {
      id: 'sampleId',
    };
    // Set step data corresponding to expectations
    clientWrapperStub.createAccount.resolves(expectedResponse);
    protoStep.setData(Struct.fromJavaScript(sampleAccount));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.createAccount).to.have.been.calledWith(sampleAccount.account);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with error if create method returns an error.', async () => {
    // Stub a response that matches expectations.
    const expectedError: Error = new Error('Any Error');
    clientWrapperStub.createAccount.rejects(expectedError);

    // Set step data corresponding to expectations
    const expectedAccount: any = [
      {
        Name: 'sampleName',
        Id: 'sampleId',
      },
    ];
    protoStep.setData(Struct.fromJavaScript(expectedAccount));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
