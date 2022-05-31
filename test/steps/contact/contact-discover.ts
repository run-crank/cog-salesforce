import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

// tslint:disable-next-line:max-line-length
import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/contact/contact-discover';

chai.use(sinonChai);

describe('DiscoverContactStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  const clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub.findContactByEmail = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('DiscoverContact');
    expect(stepDef.getName()).to.equal('Discover fields on a Salesforce Contact');
    expect(stepDef.getExpression()).to.equal('discover fields on salesforce contact (?<email>.+)');
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

  it('should respond with pass if API client resolves expected data', async () => {
    // Stub a response that matches expectations.
    const expectedUser: any = { someField: 'Expected Value' };
    clientWrapperStub.findContactByEmail.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      email: 'anything@example.com',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findContactByEmail).to.have.been.calledWith(expectations.email);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with fail if API client resolves no results', async () => {
    // Stub a response with no results in the body.
    clientWrapperStub.findContactByEmail.resolves(null);

    protoStep.setData(Struct.fromJavaScript({
      email: 'anything@example.com',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with error if API client returns error', async () => {
    // Stub a response that responds with error.
    const error: Error = new Error('Any error');
    clientWrapperStub.findContactByEmail.throws(error);

    protoStep.setData(Struct.fromJavaScript({
      email: 'anything@example.com',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });
});
