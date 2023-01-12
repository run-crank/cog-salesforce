import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

// tslint:disable-next-line:max-line-length
import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../src/proto/cog_pb';
import { Step } from '../../src/steps/bulk-object-create';

chai.use(sinonChai);

describe('BulkCreateObjectStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  const clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub.bulkCreateObjects = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('BulkCreateObject');
    expect(stepDef.getName()).to.equal('Bulk create Salesforce objects');
    expect(stepDef.getExpression()).to.equal('bulk create salesforce (?<objName>[a-zA-Z0-9]+) objects');
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

    const salesforceObjects: any = fields.filter(f => f.key === 'salesforceObjects')[0];
    expect(salesforceObjects.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(salesforceObjects.type).to.equal(FieldDefinition.Type.MAP);
  });

  it('should respond with pass if objects are created.', async () => {
    // Stub a response that matches expectations.
    const expectedResponse: any = [{ success: true, id: 'abcxyz' }, { success: true, id: 'xyzabc' }];
    const sampleObject: any = 'sampleObject';
    clientWrapperStub.bulkCreateObjects.resolves(expectedResponse);

    // Set step data corresponding to expectations
    const expectedObject: any = { objName: sampleObject, salesforceObjects: { 1: { Email: 'anything@example.com' }, 2: { Email: 'anything2@example.com' } } };
    protoStep.setData(Struct.fromJavaScript(expectedObject));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.bulkCreateObjects).to.have.been.calledWith(sampleObject, [{ Email: 'anything@example.com' }, { Email: 'anything2@example.com' }]);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with error if create method returns an error.', async () => {
    // Stub a response that matches expectations.
    const expectedError: Error = new Error('Any Error');
    clientWrapperStub.bulkCreateObjects.rejects(expectedError);

    // Set step data corresponding to expectations
    const expectedObject: any = { objName: 'sampleObject', salesforceObjects: { 1: { Email: 'anything@example.com' }, 2: { Email: 'anything2@example.com' } } };
    protoStep.setData(Struct.fromJavaScript(expectedObject));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
