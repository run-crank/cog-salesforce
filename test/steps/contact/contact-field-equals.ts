import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import { default as sinon } from 'ts-sinon';
import {
    FieldDefinition,
    RunStepResponse,
    Step as ProtoStep,
    StepDefinition,
    } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/contact/contact-field-equals';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import 'mocha';

chai.use(sinonChai);

describe('ContactFieldEqualsStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub;

  beforeEach(() => {
    clientWrapperStub = {
      findContactByEmail: sinon.stub(),
    };

    protoStep = new ProtoStep();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('ContactFieldEqualsStep');
      expect(stepDef.getName()).to.equal('Check a field on a Salesforce contact');
      // tslint:disable-next-line:max-line-length
      expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_]+) field on salesforce contact (?<email>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectedValue>.+)?');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      const field: any = fields.filter(f => f.key === 'field')[0];
      expect(field.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(field.type).to.equal(FieldDefinition.Type.STRING);

      const email: any = fields.filter(f => f.key === 'email')[0];
      expect(email.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(email.type).to.equal(FieldDefinition.Type.EMAIL);

      const operator: any = fields.filter(f => f.key === 'operator')[0];
      expect(operator.optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(operator.type).to.equal(FieldDefinition.Type.STRING);

      const expectedValue: any = fields.filter(f => f.key === 'expectedValue')[0];
      expect(expectedValue.optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(expectedValue.type).to.equal(FieldDefinition.Type.ANYSCALAR);
    });
  });

  describe('Client error', () => {
    beforeEach(() => {
      protoStep.setData(Struct.fromJavaScript({
        email: 'salesforce@test.com',
        field: 'FirstName',
        expectedValue: 'Test',
      }));
      clientWrapperStub.findContactByEmail.throws();
    });

    it('should respond with error', async () => {
      const response = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
    });
  });

  describe('Validation error', () => {
    beforeEach(() => {
      protoStep.setData(Struct.fromJavaScript({
        email: 'salesforce@test.com',
        field: 'FirstName',
        operator: 'invalidOperator',
        expectedValue: 'Test',
      }));
      clientWrapperStub.findContactByEmail.returns(Promise.resolve({ Email: 'salesforce@test.com', FirstName: 'Test' }));
    });

    it('should respond with error', async () => {
      const response = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
    });
  });

  describe('Contact not found', () => {
    beforeEach(() => {
      protoStep.setData(Struct.fromJavaScript({
        email: 'salesforce@test.com',
        field: 'FirstName',
        expectedValue: 'Test',
      }));
      clientWrapperStub.findContactByEmail.returns(Promise.resolve(undefined));
    });

    it('should respond with fail', async () => {
      const response = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
    });
  });

  describe('Contact has no expected field to check', () => {
    beforeEach(() => {
      protoStep.setData(Struct.fromJavaScript({
        email: 'salesforce@test.com',
        field: 'NonExistingField',
        expectedValue: 'Test',
      }));

      // tslint:disable-next-line:max-line-length
      clientWrapperStub.findContactByEmail.returns(Promise.resolve({ Email: 'salesforce@test.com' }));
    });

    it('should respond with fail', async () => {
      const response = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
    });
  });

  describe('Actual field value is equal to expected value', () => {
    beforeEach(() => {
      protoStep.setData(Struct.fromJavaScript({
        email: 'salesforce@test.com',
        field: 'Email',
        expectedValue: 'salesforce@test.com',
      }));

      // tslint:disable-next-line:max-line-length
      clientWrapperStub.findContactByEmail.returns(Promise.resolve({ Email: 'salesforce@test.com', Age: 50 }));
    });

    it('should respond with pass', async () => {
      const response = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
    });

    describe('Util errors', () => {
      it('should respond with error when invalid operator was passed', async () => {
        protoStep.setData(Struct.fromJavaScript({
          email: 'salesforce@test.com',
          field: 'Email',
          expectedValue: 'salesforce@test.com',
          operator: 'unknown operator',
        }));
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });

      it('should respond with error when actual and expected values with different types are compared', async () => {
        protoStep.setData(Struct.fromJavaScript({
          email: 'salesforce@test.com',
          field: 'Age',
          expectedValue: 'nonNumeric',
          operator: 'be greater than',
        }));
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });

  describe('Actual field value is NOT equal to expected value', () => {
    beforeEach(() => {
      protoStep.setData(Struct.fromJavaScript({
        email: 'salesforce@test.com',
        field: 'Email',
        expectedValue: 'notequal@test.com',
      }));

      // tslint:disable-next-line:max-line-length
      clientWrapperStub.findContactByEmail.returns(Promise.resolve({ Email: 'salesforce@test.com' }));
    });

    it('should respond with pass', async () => {
      const response = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
    });
  });

  it("should respond with error when expectedValue is null when operator is not 'be set' or 'not be set'", async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = "The operator '%s' requires an expected value. Please provide one.";

    // Set step data corresponding to expectations
    const expectations: any = {
      email: 'anyEmail',
      field: 'anyField',
      expectedValue: null,
      operator: 'anyOperator',
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
      email: 'anyEmail',
      field: 'anyField',
      operator: 'anyOperator',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });
});
