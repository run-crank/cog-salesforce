import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

// tslint:disable-next-line:max-line-length
import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/opportunity/opportunity-create';

chai.use(sinonChai);

describe('CreateOpportunityStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub = sinon.stub();
    clientWrapperStub.createOpportunity = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('CreateOpportunity');
    expect(stepDef.getName()).to.equal('Create a Salesforce opportunity');
    expect(stepDef.getExpression()).to.equal('create a salesforce opportunity');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Opportunity field
    const opportunity: any = fields.filter(f => f.key === 'opportunity')[0];
    expect(opportunity.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(opportunity.type).to.equal(FieldDefinition.Type.MAP);
  });

  it('should respond with pass if opporunity is created.', async () => {
    // Stub a response that matches expectations.
    const sampleOpportunity = {
      opportunity: {
        Name: 'sampleName',
        id: 'sampleId',
      },
    };
    const expectedResponse = {
      id: 'sampleId',
    };
    // Set step data corresponding to expectations
    clientWrapperStub.createOpportunity.resolves(expectedResponse);
    protoStep.setData(Struct.fromJavaScript(sampleOpportunity));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.createOpportunity).to.have.been.calledWith(sampleOpportunity.opportunity);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with error if create method returns an error.', async () => {
    // Stub a response that matches expectations.
    const expectedError: Error = new Error('Any Error');
    clientWrapperStub.createOpportunity.rejects(expectedError);

    // Set step data corresponding to expectations
    const expectedOpportunity: any = [
      {
        Name: 'sampleName',
        Id: 'sampleId',
      },
    ];
    protoStep.setData(Struct.fromJavaScript(expectedOpportunity));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
