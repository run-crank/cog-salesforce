import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

// tslint:disable-next-line:max-line-length
import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/campaign-member/campaign-member-field-equals';

chai.use(sinonChai);

describe('CampaignMemberFieldEqualsStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  const clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub.findCampaignMemberByEmailAndCampaignId = sinon.stub();
    clientWrapperStub.findCampaignById = sinon.stub();
    clientWrapperStub.findCampaignById.resolves({Name: 'Test Campaign'});
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('CampaignMemberFieldEquals');
    expect(stepDef.getName()).to.equal('Check a field on a Salesforce campaign member');
    expect(stepDef.getExpression()).to.equal('the salesforce lead (?<email>.+) should have campaign member (?<field>[a-z0-9_]+) (?<operator>set to one of|set to|set|not set to one of|not set to|not set|containing|not containing|less than|greater than) ?(?<expectedValue>.+)? on campaign (?<campaignId>.+)');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
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

    // Campaign Id field
    const campaignId: any = fields.filter(f => f.key === 'campaignId')[0];
    expect(campaignId.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(campaignId.type).to.equal(FieldDefinition.Type.STRING);

    // Field field
    const field: any = fields.filter(f => f.key === 'field')[0];
    expect(field.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(field.type).to.equal(FieldDefinition.Type.STRING);

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
    // Stub a response that matches expectations.
    const expectedUser: any = { campaignId: 'someId', someField: 'someValue' };
    clientWrapperStub.findCampaignMemberByEmailAndCampaignId.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      email: 'someEmail',
      campaignId: expectedUser.campaignId,
      field: 'someField',
      expectedValue: expectedUser.someField,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findCampaignMemberByEmailAndCampaignId).to.have.been.calledWith(expectations.email, expectations.campaignId);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with error when actual and expected values have different type and compared', async () => {
    // Stub a response that matches expectations.
    const expectedUser: any = { campaignId: 'someId', someField: 'someValue', age: 35 };
    clientWrapperStub.findCampaignMemberByEmailAndCampaignId.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      email: 'someEmail',
      campaignId: expectedUser.campaignId,
      field: 'age',
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
      email: 'someEmail',
      campaignId: expectedUser.campaignId,
      field: 'someField',
      expectedValue: expectedUser.someField,
      operator: 'unknown operator',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with fail if API client does not find campaign member', async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = 'No Campaign Membership found between %s and campaign %s';
    clientWrapperStub.findCampaignMemberByEmailAndCampaignId.resolves(null);

    // Set step data corresponding to expectations
    const expectations: any = {
      email: 'someEmail',
      campaignId: 'someId',
      field: 'someField',
      expectedValue: 'someField',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with error if API client gets the campaign member without expected field', async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = 'The %s field does not exist on Campaign Member with email %s and campaign %s';
    const expectedUser: any = { CampaignId: 'someId', someOtherField: 'someValue' };
    clientWrapperStub.findCampaignMemberByEmailAndCampaignId.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      email: 'someEmail',
      campaignId: 'someId',
      field: 'someField',
      expectedValue: 'someField',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with fail if API client resolved unexpected data', async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = 'Expected %s field to be %s, but it was actually %s';
    const expectedUser: any = { CampaignId: 'someId', someField: 'someOtherValue' };
    clientWrapperStub.findCampaignMemberByEmailAndCampaignId.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      email: 'someEmail',
      campaignId: 'someId',
      field: 'someField',
      expectedValue: 'someField',
    };

    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with error if API client throws an exception', async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = 'There was a problem checking the Campaign Member: %s';
    const expectedError: Error = new Error('Any Error');
    clientWrapperStub.findCampaignMemberByEmailAndCampaignId.rejects(expectedError);

    // Set step data corresponding to expectations
    const expectations: any = {
      email: 'someField',
      campaignId: 'someId',
      operator: 'anyOperator',
      expectedValue: 'anyValue',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error when inputing invalid operator', async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = 'There was an error during validation of campaign member field: %s';
    const expectedUser: any = { campaignId: 'someId', someField: 'someValue' };
    clientWrapperStub.findCampaignMemberByEmailAndCampaignId.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      email: 'someField',
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
      email: 'someField',
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
      email: 'someField',
      campaignId: 'someId',
      operator: 'anyOtherOperator',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });
});
