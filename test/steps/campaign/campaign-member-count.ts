import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

// tslint:disable-next-line:max-line-length
import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/campaign/campaign-member-count';

chai.use(sinonChai);

describe('CampaignMemberCountStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  const clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub.findCampaignMemberByEmailAndCampaignId = sinon.stub();
    clientWrapperStub.findCampaignById = sinon.stub();
    clientWrapperStub.findCampaignById.resolves({Name: 'Test Campaign', NumberOfLeads: 3, NumberOfContacts: 5});
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('CampaignMemberCountStep');
    expect(stepDef.getName()).to.equal('Check the number on a Salesforce Campaign Member');
    expect(stepDef.getExpression()).to.equal('the number of members from salesforce campaign (?<campaignId>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Campaign Id field
    const campaignId: any = fields.filter(f => f.key === 'campaignId')[0];
    expect(campaignId.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(campaignId.type).to.equal(FieldDefinition.Type.STRING);

    // Operator field
    const operator: any = fields.filter(f => f.key === 'operator')[0];
    expect(operator.optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
    expect(operator.type).to.equal(FieldDefinition.Type.STRING);

    // Expected Value field
    const expectedValue: any = fields.filter(f => f.key === 'expectedValue')[0];
    expect(expectedValue.optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
    expect(expectedValue.type).to.equal(FieldDefinition.Type.ANYSCALAR);
  });

  it('should respond with pass if API client resolves expected data', async () => {
    // Set step data corresponding to expectations
    const expectations: any = {
      campaignId: 'someId',
      operator: 'be',
      expectedValue: 8,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with error when actual and expected values have different type and compared', async () => {
    // Stub a response that matches expectations.
    const expectedUser: any = { campaignId: 'someId', someField: 'someValue', age: 35 };
    clientWrapperStub.findCampaignMemberByEmailAndCampaignId.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      campaignId: expectedUser.campaignId,
      expectedValue: 'nonNumeric',
      operator: 'greater than',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error when invalid operator was passed', async () => {
    // Stub a response that matches expectations.
    const expectedUser: any = { campaignId: 'someId', someField: 'someValue' };
    clientWrapperStub.findCampaignMemberByEmailAndCampaignId.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      campaignId: expectedUser.campaignId,
      expectedValue: expectedUser.someField,
      operator: 'unknown operator',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with fail if API client resolved unexpected data', async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = 'Expected %s field to be %s, but it was actually %s';
    const expectedUser: any = { CampaignId: 'someId', someField: 'someOtherValue' };
    clientWrapperStub.findCampaignMemberByEmailAndCampaignId.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      campaignId: 'someId',
      expectedValue: 'someField',
    };

    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with error if API client throws an exception', async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = 'There was a problem checking the Campaign Member Count: %s';
    const expectedError: Error = new Error('Any Error');

    clientWrapperStub.findCampaignById.throws(expectedError);
    // Set step data corresponding to expectations
    const expectations: any = {
      campaignId: 'someId',
      operator: 'be',
      expectedValue: 'anyValue',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error when inputing invalid operator', async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = '%s Please provide one of: %s';

    // Set step data corresponding to expectations
    const expectations: any = {
      campaignId: 'someId',
      operator: 'invalidOperator',
      expectedValue: 'anyValue',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it("should respond with error when expectedValue is null when operator is not 'be set' or 'not be set'", async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = "The operator '%s' requires an expected value. Please provide one.";

    // Set step data corresponding to expectations
    const expectations: any = {
      campaignId: 'someId',
      operator: 'anyOtherOperator',
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
      campaignId: 'someId',
      operator: 'anyOtherOperator',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });
});
