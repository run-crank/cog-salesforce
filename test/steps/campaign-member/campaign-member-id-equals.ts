import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/campaign-member/campaign-member-id-equals';

chai.use(sinonChai);

describe('CampaignMemberCampaignIdEqualsStep', () => {
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
    expect(stepDef.getStepId()).to.equal('CampaignMemberCampaignIdEquals');
    expect(stepDef.getName()).to.equal('Check Salesforce campaign membership');
    expect(stepDef.getExpression()).to.equal('the salesforce lead (?<email>.+) should be a member of campaign (?<campaignId>.+)');
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

    // Status field
    const status: any = fields.filter(f => f.key === 'memberStatus')[0];
    expect(status.optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
    expect(status.type).to.equal(FieldDefinition.Type.STRING);
  });

  it('should respond with pass if API client resolves expected data', async () => {
    // Stub a response that matches expectations.
    const expectedUser: any = { CampaignId: 'someId' };
    clientWrapperStub.findCampaignMemberByEmailAndCampaignId.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      email: 'someEmail',
      campaignId: 'someId',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findCampaignMemberByEmailAndCampaignId).to.have.been.calledWith(expectations.email, expectations.campaignId);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with fail if API client does not find Campaign Member', async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = 'No Campaign Membership found between "%s" and campaign "%s"';
    clientWrapperStub.findCampaignMemberByEmailAndCampaignId.resolves(null);

    // Set step data corresponding to expectations
    const expectations: any = {
      email: 'someEmail',
      campaignId: 'someId',
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
      email: 'someEmail',
      campaignId: 'someId',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });
});
