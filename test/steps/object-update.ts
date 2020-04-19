import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

// tslint:disable-next-line:max-line-length
import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../src/proto/cog_pb';
import { Step } from '../../src/steps/object-update';

chai.use(sinonChai);

describe('UpdateObjectStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  const clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub.updateObject = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('UpdateObject');
    expect(stepDef.getName()).to.equal('Update a Salesforce Object');
    expect(stepDef.getExpression()).to.equal('update the salesforce (?<objName>[a-zA-Z0-9]+) object identified by id (?<identifier>[^\s]+)');
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

    const identifier: any = fields.filter(f => f.key === 'identifier')[0];
    expect(identifier.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(identifier.type).to.equal(FieldDefinition.Type.STRING);

    const salesforceObject: any = fields.filter(f => f.key === 'salesforceObject')[0];
    expect(salesforceObject.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(salesforceObject.type).to.equal(FieldDefinition.Type.MAP);
  });

  it('should respond with pass if object is updated.', async () => {
    // Stub a response that matches expectations.
    const expectedResponse: any = { id: 'abcxyz' };
    const sampleObject: any = 'sampleObject';
    const sampleId: any = 'sampeleId';
    const expectedObject: any = { Email: 'anything@example.com', Id: sampleId };

    clientWrapperStub.updateObject.resolves(expectedResponse);

    // Set step data corresponding to expectations
    const stepInput: any = { objName: sampleObject, identifier: sampleId, salesforceObject: { Email: 'anything@example.com' } };
    protoStep.setData(Struct.fromJavaScript(stepInput));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.updateObject).to.have.been.calledWith(sampleObject, expectedObject);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with error if update method returns an error.', async () => {
    // Stub a response that matches expectations.
    const expectedError: Error = new Error('Any Error');
    const sampleId: any = 'sampeleId';
    clientWrapperStub.updateObject.rejects(expectedError);

    // Set step data corresponding to expectations
    const expectedObject: any = { objName: 'sampleObject', identifier: sampleId, salesforceObject: { Email: 'anything@example.com' } };
    protoStep.setData(Struct.fromJavaScript(expectedObject));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
