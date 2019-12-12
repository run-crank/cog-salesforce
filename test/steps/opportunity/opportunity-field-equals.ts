import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

// tslint:disable-next-line:max-line-length
import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/opportunity/opportunity-field-equals';

chai.use(sinonChai);

describe('OpportunityFieldEqualsStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  const clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub.findOpportunityByIdentifier = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('OpportunityFieldEquals');
    expect(stepDef.getName()).to.equal('Check a field on a Salesforce Opportunity');
    expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_]+) field on salesforce opportunity with (?<idField>[a-zA-Z0-9_]+) (?<identifier>.+) should (?<operator>be less than|be greater than|be|contain|not be|not contain) (?<expectedValue>.+)');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Fields
    const idField: any = fields.filter(f => f.key === 'idField')[0];
    expect(idField.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(idField.type).to.equal(FieldDefinition.Type.STRING);

    const identifier: any = fields.filter(f => f.key === 'identifier')[0];
    expect(identifier.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(identifier.type).to.equal(FieldDefinition.Type.ANYSCALAR);

    const field: any = fields.filter(f => f.key === 'field')[0];
    expect(field.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(field.type).to.equal(FieldDefinition.Type.STRING);

    const expectedValue: any = fields.filter(f => f.key === 'expectedValue')[0];
    expect(expectedValue.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(expectedValue.type).to.equal(FieldDefinition.Type.ANYSCALAR);
  });

  it('should respond with pass if API client resolves expected data', async () => {
    // Stub a response that matches expectations.
    const sampleIdField = 'someIdField';
    const sampleIdentifier = 'someIdentifier';
    const sampleField = 'someField';
    const sampleValue = 'someValue';

    const expectedOpportunity = [
      {
        Id: 'someId',
        [sampleField]: sampleValue,
        Name: 'someName',
      },
    ];
    clientWrapperStub.findOpportunityByIdentifier.resolves(expectedOpportunity);

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: sampleIdField,
      identifier: sampleIdentifier,
      field: sampleField,
      expectedValue: sampleValue,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findOpportunityByIdentifier).to.have.been.calledWith(sampleIdField, sampleIdentifier, sampleField);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with fail if API client resolves unexpected data', async () => {
    // Stub a response that matches expectations.
    const sampleIdField = 'someIdField';
    const sampleIdentifier = 'someIdentifier';
    const sampleField = 'someField';
    const sampleValue = 'someValue';

    const expectedOpportunity = [
      {
        Id: 'someId',
        [sampleField]: 'someOtherValue',
        Name: 'someName',
      },
    ];
    clientWrapperStub.findOpportunityByIdentifier.resolves(expectedOpportunity);

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: sampleIdField,
      identifier: sampleIdentifier,
      field: sampleField,
      expectedValue: sampleValue,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findOpportunityByIdentifier).to.have.been.calledWith(sampleIdField, sampleIdentifier, sampleField);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with error if more than one opportunity is retrieved', async () => {
    // Stub a response that matches expectations.
    const sampleIdField = 'someIdField';
    const sampleIdentifier = 'someIdentifier';
    const sampleField = 'someField';
    const sampleValue = 'someValue';
    const expectedResponseMessage = 'More than one opportunity matches %s %s';

    const expectedOpportunity = [
      {
        Id: 'someId',
        [sampleField]: sampleValue,
        Name: 'someName',
      },
      {
        Id: 'someId',
        [sampleField]: sampleValue,
        Name: 'someName',
      },
    ];
    clientWrapperStub.findOpportunityByIdentifier.resolves(expectedOpportunity);

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: sampleIdField,
      identifier: sampleIdentifier,
      field: sampleField,
      expectedValue: sampleValue,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findOpportunityByIdentifier).to.have.been.calledWith(sampleIdField, sampleIdentifier, sampleField);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error if opportunity does not exist', async () => {
    // Stub a response that matches expectations.
    const sampleIdField = 'someIdField';
    const sampleIdentifier = 'someIdentifier';
    const sampleField = 'someField';
    const sampleValue = 'someValue';
    const expectedResponseMessage = 'No opportunity matches %s %s';

    const expectedOpportunity = [];
    clientWrapperStub.findOpportunityByIdentifier.resolves(expectedOpportunity);

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: sampleIdField,
      identifier: sampleIdentifier,
      field: sampleField,
      expectedValue: sampleValue,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findOpportunityByIdentifier).to.have.been.calledWith(sampleIdField, sampleIdentifier, sampleField);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error if field does not exist on the opportunity', async () => {
    // Stub a response that matches expectations.
    const sampleIdField = 'someIdField';
    const sampleIdentifier = 'someIdentifier';
    const sampleField = 'someField';
    const sampleValue = 'someValue';
    const expectedResponseMessage = 'The %s field does not exist on Opportunity %s';

    const expectedOpportunity = [
      {
        Id: 'someId',
        someOtherField: sampleValue,
        Name: 'someName',
      },
    ];
    clientWrapperStub.findOpportunityByIdentifier.resolves(expectedOpportunity);

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: sampleIdField,
      identifier: sampleIdentifier,
      field: sampleField,
      expectedValue: sampleValue,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findOpportunityByIdentifier).to.have.been.calledWith(sampleIdField, sampleIdentifier, sampleField);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error if API client returns error', async () => {
    // Stub a response that matches expectations.
    const sampleIdField = 'someIdField';
    const sampleIdentifier = 'someIdentifier';
    const sampleField = 'someField';
    const sampleValue = 'someValue';
    const expectedResponseMessage = 'There was a problem checking the Opportunity: %s';

    const error = new Error('An API Error');
    clientWrapperStub.findOpportunityByIdentifier.throws(error);

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: sampleIdField,
      identifier: sampleIdentifier,
      field: sampleField,
      expectedValue: sampleValue,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findOpportunityByIdentifier).to.have.been.calledWith(sampleIdField, sampleIdentifier, sampleField);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error when inputing invalid operator', async () => {
    // Stub a response that matches expectations.
    const sampleIdField = 'someIdField';
    const sampleIdentifier = 'someIdentifier';
    const sampleField = 'someField';
    const sampleValue = 'someValue';
    const expectedResponseMessage = '%s Please provide one of: %s';

    const expectedOpportunity = [
      {
        Id: 'someId',
        [sampleField]: sampleValue,
        Name: 'someName',
      },
    ];
    clientWrapperStub.findOpportunityByIdentifier.resolves(expectedOpportunity);

    // Set step data corresponding to expectations
    const expectations: any = {
      idField: sampleIdField,
      identifier: sampleIdentifier,
      field: sampleField,
      operator: 'invalidOperator',
      expectedValue: sampleValue,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findOpportunityByIdentifier).to.have.been.calledWith(sampleIdField, sampleIdentifier, sampleField);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });
});
