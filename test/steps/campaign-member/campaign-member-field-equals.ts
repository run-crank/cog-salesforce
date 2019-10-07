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
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('CampaignMemberFieldEquals');
    expect(stepDef.getName()).to.equal('Check a field on a Salesforce Campaign Member');
    expect(stepDef.getExpression()).to.equal('the salesforce lead (?<email>.+) should have campaign member (?<field>.+) set to (?<expectedValue>.+) on campaign (?<campaignId>.+)');
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

    const field: any = fields.filter(f => f.key === 'field')[0];
    expect(field.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(field.type).to.equal(FieldDefinition.Type.STRING);

    // Campaign Id field
    const expectedValue: any = fields.filter(f => f.key === 'expectedValue')[0];
    expect(expectedValue.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
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
    expect(clientWrapperStub.findCampaignMemberByEmailAndCampaignId).to.have.been.calledWith(expectations.email, expectations.campaignId, [expectations.field]);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
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
    const expectedResponseMessage: string = 'The %s field does not exist on Campaign Member with email %s and campaign id %s';
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
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with fail if API client resolved unexpected data', async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = 'Expected Campaign Member %s field to be %s, but it was actually %s';
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
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
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
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });
});
