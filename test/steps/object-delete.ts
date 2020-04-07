import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

// tslint:disable-next-line:max-line-length
import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../src/proto/cog_pb';
import { Step } from '../../src/steps/object-delete';

chai.use(sinonChai);

describe('CreateObjectStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  const clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub.deleteObjectById = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('DeleteObject');
    expect(stepDef.getName()).to.equal('Delete a Salesforce Object');
    expect(stepDef.getExpression()).to.equal('delete the salesforce (?<objName>[a-zA-Z0-9]+) object with id (?<id>.+)');
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

    const id: any = fields.filter(f => f.key === 'id')[0];
    expect(id.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(id.type).to.equal(FieldDefinition.Type.STRING);
  });

  it('should respond with pass if object is deleted.', async () => {
    // Stub a response that matches expectations.
    const expectedResponse: any = { id: 'abcxyz' };
    const sampleObject: any = 'sampleObject';
    clientWrapperStub.deleteObjectById.resolves(expectedResponse);

    // Set step data corresponding to expectations
    const expectedObject: any = { objName: 'sampleObject', id: 'sampleId' };
    protoStep.setData(Struct.fromJavaScript(expectedObject));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.deleteObjectById).to.have.been.calledWith(sampleObject, expectedObject.id);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with error if delete method returns an error.', async () => {
    // Stub a response that matches expectations.
    const expectedError: Error = new Error('Any Error');
    clientWrapperStub.deleteObjectById.rejects(expectedError);

    // Set step data corresponding to expectations
    const expectedObject: any = { objName: 'sampleObject', id: 'sampleId' };
    protoStep.setData(Struct.fromJavaScript(expectedObject));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
