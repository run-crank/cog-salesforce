import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import { default as sinon } from 'ts-sinon';
import {
    FieldDefinition,
    RunStepResponse,
    Step as ProtoStep,
    StepDefinition,
    } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/contact/contact-delete';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import 'mocha';

chai.use(sinonChai);

describe('ContactDeleteStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub;

  beforeEach(() => {
    clientWrapperStub = {
      deleteContactByEmail: sinon.stub(),
    };

    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('ContactDeleteStep');
      expect(stepDef.getName()).to.equal('Delete a Salesforce contact');
      expect(stepDef.getExpression()).to.equal('delete the (?<email>.+) salesforce contact');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      const email = fields.filter(f => f.key === 'email')[0];
      expect(email.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(email.type).to.equal(FieldDefinition.Type.EMAIL);
    });
  });

  describe('Contact created', () => {
    const expectedEmail = 'salesforce@test.com';
    beforeEach(() => {
      protoStep.setData(Struct.fromJavaScript({ email: expectedEmail }));
      clientWrapperStub.deleteContactByEmail.returns(Promise.resolve({ id: 1 }));
    });

    it('should call deleteContactByEmail with expectedArgs', async () => {
      await stepUnderTest.executeStep(protoStep);
      expect(clientWrapperStub.deleteContactByEmail).to.have.been.calledWith(expectedEmail);
    });

    it('should respond with pass', async () => {
      const response = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
    });
  });

  describe('Error', () => {
    beforeEach(() => {
      protoStep.setData(Struct.fromJavaScript({ contact: {} }));
      clientWrapperStub.deleteContactByEmail.throws();
    });

    it('should respond with error', async () => {
      const response = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
    });
  });
});
