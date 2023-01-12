import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

// tslint:disable-next-line:max-line-length
import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/tenant-usage-entitlements/tenant-usage-entitlement-field-equals';

chai.use(sinonChai);

describe('TenantUsageEntitlementFieldEqualsStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  const clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub.findObjectById = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('TenantUsageEntitlementsFieldEquals');
    expect(stepDef.getName()).to.equal('Check Salesforce usage');
    expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_]+) field on salesforce tenant usage entitlements with id (?<id>[^\s]+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectedValue>.+)?');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Field field
    const field: any = fields.filter(f => f.key === 'field')[0];
    expect(field.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(field.type).to.equal(FieldDefinition.Type.STRING);

    // Id field
    const id: any = fields.filter(f => f.key === 'id')[0];
    expect(id.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(id.type).to.equal(FieldDefinition.Type.STRING);

    // Operator field
    const operator: any = fields.filter(f => f.key === 'operator')[0];
    expect(operator.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(operator.type).to.equal(FieldDefinition.Type.STRING);

    // Expected Value field
    const expectedValue: any = fields.filter(f => f.key === 'expectedValue')[0];
    expect(expectedValue.optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
    expect(expectedValue.type).to.equal(FieldDefinition.Type.ANYSCALAR);
  });

  it('should respond with pass if API client resolves expected data', async () => {
    // Stub a response that matches expectations.
    const expectedUser: any = { someField: 'Expected Value' };
    clientWrapperStub.findObjectById.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      field: 'someField',
      id: 'sampleId',
      operator: 'be',
      expectedValue: expectedUser.someField,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with error when invalid operator was passed', async () => {
    // Stub a response that matches expectations.
    const expectedUser: any = { someField: 'Expected Value' };
    clientWrapperStub.findObjectById.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      field: 'someField',
      id: 'sampleId',
      operator: 'invalidOperator',
      expectedValue: expectedUser.someField,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error when actual and expected values have different types and compared', async () => {
    // Stub a response that matches expectations.
    const expectedUser: any = { someField: 'Expected Value', numericField: 5000 };
    clientWrapperStub.findObjectById.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      field: 'numericField',
      id: 'sampleId',
      operator: 'be greater than',
      expectedValue: 'nonNumeric',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with fail if API client resolves unexpected data', async () => {
    // Stub a response that does not match expectations.
    const expectedUser: any = { someField: 'Expected Value' };
    clientWrapperStub.findObjectById.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      field: 'someField',
      id: 'sampleId',
      operator: 'be',
      expectedValue: 'otherValue',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with fail if API client resolves no results', async () => {
    // Stub a response with no results in the body.
    const expectedUser: any = { someField: 'Expected Value' };
    clientWrapperStub.findObjectById.resolves(null);

    // Set step data corresponding to expectations
    const expectations: any = {
      field: 'someField',
      id: 'sampleId',
      operator: 'be',
      expectedValue: expectedUser.someField,
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with fail if resolved user does not contain given field', async () => {
    // Stub a response with valid response, but no expected field.
    const expectedUser: any = { someField: 'Expected Value' };
    clientWrapperStub.findObjectById.resolves(expectedUser);

    const expectations: any = {
      field: 'someOtherField',
      id: 'sampleId',
      operator: 'be',
      expectedValue: expectedUser.someField,
    };

    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with error if API client returns error', async () => {
    // Stub a response that responds with error.
    const expectedUser: any = { someField: 'Expected Value' };
    const error: Error = new Error('Any error');
    clientWrapperStub.findObjectById.throws(error);

    const expectations: any = {
      field: 'someField',
      id: 'sampleId',
      operator: 'be',
      expectedValue: expectedUser.someField,
    };

    protoStep.setData(Struct.fromJavaScript(expectations));
    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it("should respond with error when expectedValue is null when operator is not 'be set' or 'not be set'", async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = "The operator '%s' requires an expected value. Please provide one.";

    // Set step data corresponding to expectations
    const expectations: any = {
      field: 'anyField',
      id: 'anyId',
      operator: 'anyOperator',
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
      field: 'anyField',
      id: 'anyId',
      operator: 'anyOperator',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  describe('PercentageUsed', () => {
    it('should respond with pass if API client resolves expected data', async () => {
      // Stub a response that matches expectations.
      const expectedUser: any = { AmountUsed: 10, CurrentAmountAllowed: 100 };
      clientWrapperStub.findObjectById.resolves(expectedUser);
  
      // Set step data corresponding to expectations
      const expectations: any = {
        field: 'PercentageUsed',
        id: 'sampleId',
        operator: 'be less than',
        expectedValue: 50,
      };
      protoStep.setData(Struct.fromJavaScript(expectations));
  
      const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
    });

    it('should respond with pass if API client resolves expected data while AmountUsed is undefined', async () => {
      // Stub a response that matches expectations.
      const expectedUser: any = { CurrentAmountAllowed: 100 };
      clientWrapperStub.findObjectById.resolves(expectedUser);
  
      // Set step data corresponding to expectations
      const expectations: any = {
        field: 'PercentageUsed',
        id: 'sampleId',
        operator: 'be less than',
        expectedValue: 50,
      };
      protoStep.setData(Struct.fromJavaScript(expectations));
  
      const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
    });

    it('should respond with pass if API client resolves expected data while AmountUsed is null', async () => {
      // Stub a response that matches expectations.
      const expectedUser: any = { AmountUsed: 10, CurrentAmountAllowed: 100 };
      clientWrapperStub.findObjectById.resolves(expectedUser);
  
      // Set step data corresponding to expectations
      const expectations: any = {
        field: 'PercentageUsed',
        id: 'sampleId',
        operator: 'be less than',
        expectedValue: 50,
      };
      protoStep.setData(Struct.fromJavaScript(expectations));
  
      const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
    });

    it('should respond with pass if API client resolves expected data while AmountUsed is 0', async () => {
      // Stub a response that matches expectations.
      const expectedUser: any = { AmountUsed: 0, CurrentAmountAllowed: 100 };
      clientWrapperStub.findObjectById.resolves(expectedUser);
  
      // Set step data corresponding to expectations
      const expectations: any = {
        field: 'PercentageUsed',
        id: 'sampleId',
        operator: 'be less than',
        expectedValue: 50,
      };
      protoStep.setData(Struct.fromJavaScript(expectations));
  
      const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
    });

    it('should respond with error if API client resolves expected data while CurrentAmountAllowed used is null', async () => {
      // Stub a response that matches expectations.
      const expectedUser: any = { AmountUsed: 0, CurrentAmountAllowed: null };
      clientWrapperStub.findObjectById.resolves(expectedUser);
  
      // Set step data corresponding to expectations
      const expectations: any = {
        field: 'PercentageUsed',
        id: 'sampleId',
        operator: 'be less than',
        expectedValue: 50,
      };
      protoStep.setData(Struct.fromJavaScript(expectations));
  
      const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
    });

    it('should respond with error if API client resolves expected data while CurrentAmountAllowed used is 0', async () => {
      // Stub a response that matches expectations.
      const expectedUser: any = { AmountUsed: 0, CurrentAmountAllowed: 0 };
      clientWrapperStub.findObjectById.resolves(expectedUser);
  
      // Set step data corresponding to expectations
      const expectations: any = {
        field: 'PercentageUsed',
        id: 'sampleId',
        operator: 'be less than',
        expectedValue: 50,
      };
      protoStep.setData(Struct.fromJavaScript(expectations));
  
      const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
    });

    it('should respond with error if API client resolves expected data while CurrentAmountAllowed used is undefined', async () => {
      // Stub a response that matches expectations.
      const expectedUser: any = { AmountUsed: 0 };
      clientWrapperStub.findObjectById.resolves(expectedUser);
  
      // Set step data corresponding to expectations
      const expectations: any = {
        field: 'PercentageUsed',
        id: 'sampleId',
        operator: 'be less than',
        expectedValue: 50,
      };
      protoStep.setData(Struct.fromJavaScript(expectations));
  
      const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
    });
  });
});
