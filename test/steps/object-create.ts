import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

// tslint:disable-next-line:max-line-length
import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../src/proto/cog_pb';
import { Step } from '../../src/steps/object-create';

chai.use(sinonChai);

describe('CreateObjectStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  const clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub.createObject = sinon.stub();
    clientWrapperStub.findObjectById = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('CreateObject');
    expect(stepDef.getName()).to.equal('Create a Salesforce object');
    expect(stepDef.getExpression()).to.equal('create a salesforce (?<objName>[a-zA-Z0-9]+) object');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Object fields
    const objName: any = fields.filter(f => f.key === 'objName')[0];
    expect(objName.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(objName.type).to.equal(FieldDefinition.Type.STRING);

    const salesforceObject: any = fields.filter(f => f.key === 'salesforceObject')[0];
    expect(salesforceObject.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(salesforceObject.type).to.equal(FieldDefinition.Type.MAP);
  });

  it('should respond with pass if object is created.', async () => {
    // Stub a response that matches expectations.
    const expectedResponse: any = { id: 'abcxyz' };
    const sampleObject: any = 'sampleObject';
    clientWrapperStub.createObject.resolves(expectedResponse);
    clientWrapperStub.findObjectById.resolves(expectedResponse);

    // Set step data corresponding to expectations
    const expectedObject: any = { objName: sampleObject, salesforceObject: { Email: 'anything@example.com' } };
    protoStep.setData(Struct.fromJavaScript(expectedObject));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.createObject).to.have.been.calledWith(sampleObject, expectedObject.salesforceObject);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with error if create method returns an error.', async () => {
    // Stub a response that matches expectations.
    const expectedError: Error = new Error('Any Error');
    clientWrapperStub.createObject.rejects(expectedError);

    // Set step data corresponding to expectations
    const expectedObject: any = { objName: 'sampleObject', salesforceObject: { Email: 'anything@example.com' } };
    protoStep.setData(Struct.fromJavaScript(expectedObject));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
