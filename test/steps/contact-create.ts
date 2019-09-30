import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import { default as sinon } from 'ts-sinon';
import {
    FieldDefinition,
    RunStepResponse,
    Step as ProtoStep,
    StepDefinition,
    } from '../../src/proto/cog_pb';
import { Step } from '../../src/steps/contact-create';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import 'mocha';

chai.use(sinonChai);

describe('ContactCreateStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub;

  beforeEach(() => {
    clientWrapperStub = {
      createContact: sinon.stub(),
    };

    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('ContactCreateStep');
      expect(stepDef.getName()).to.equal('Create a Salesforce Contact');
      expect(stepDef.getExpression()).to.equal('create a salesforce contact');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      const contact: any = fields.filter(f => f.key === 'contact')[0];
      expect(contact.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(contact.type).to.equal(FieldDefinition.Type.MAP);
    });
  });

  describe('Contact created', () => {
    const expectedContact = {
      LastName: 'Test',
      FirstName: 'Unit',
      AccountId: 'ABC123',
    };
    beforeEach(() => {
      protoStep.setData(Struct.fromJavaScript({ contact: expectedContact }));
      clientWrapperStub.createContact.returns(Promise.resolve({ id: 1 }));
    });

    it('should call createContact with expectedArgs', async () => {
      await stepUnderTest.executeStep(protoStep);
      expect(clientWrapperStub.createContact).to.have.been.calledWith(expectedContact);
    });

    it('should respond with pass', async () => {
      const response = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
    });
  });

  describe('Error', () => {
    beforeEach(() => {
      protoStep.setData(Struct.fromJavaScript({ contact: {} }));
      clientWrapperStub.createContact.throws();
    });

    it('should respond with error', async () => {
      const response = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
    });
  });
});
