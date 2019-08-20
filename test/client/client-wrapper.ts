import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import * as justForIdeTypeHinting from 'chai-as-promised';
import 'mocha';

import { ClientWrapper } from '../../src/client/client-wrapper';
import { Metadata } from 'grpc';

chai.use(sinonChai);
chai.use(require('chai-as-promised'));

describe('ClientWrapper', () => {
  const expect = chai.expect;
  let sfdcClientStub: any;
  let sobjectStub: any;
  let jsForceConstructorStub: any;
  let metadata: Metadata;
  let clientWrapperUnderTest: ClientWrapper;

  beforeEach(() => {
    sobjectStub = sinon.stub();
    sobjectStub.delete = sinon.stub();
    sobjectStub.findOne = sinon.stub();
    sobjectStub.create = sinon.stub();
    sfdcClientStub = {
      login: sinon.stub(),
      sobject: sinon.stub(),
    };
    sfdcClientStub.login.callsArgWith(2, null, {});
    sfdcClientStub.sobject.returns(sobjectStub);
    jsForceConstructorStub = sinon.stub();
    jsForceConstructorStub.Connection = sinon.stub();
    jsForceConstructorStub.Connection.returns(sfdcClientStub)
  });

  it('authentication', () => {
    // Construct grpc metadata and assert the client was authenticated.
    const username = 'some.user@example.com';
    const password = 'some-user-password';
    const oauth2Args = {
      loginUrl: 'https://na123.salesforce.com',
      clientId: 'some-client-id',
      clientSecret: 'some-client-secret',
    };
    metadata = new Metadata();
    metadata.add('instanceUrl', oauth2Args.loginUrl);
    metadata.add('clientId', oauth2Args.clientId);
    metadata.add('clientSecret', oauth2Args.clientSecret);
    metadata.add('username', username);
    metadata.add('password', password);

    // Assert that the underlying API client was authenticated correctly.
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);
    expect(jsForceConstructorStub.Connection).to.have.been.calledWith({oauth2: oauth2Args});
    expect(sfdcClientStub.login).to.have.been.calledWith(username, password);
  });

  it('createLead', async () => {
    const expectedLead = { email: 'test@example.com' };
    const expectedResult = {Id: 'xyz123'};
    let actualResult;

    // Set up test instance.
    sobjectStub.create.callsArgWith(1, null, expectedResult);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    actualResult = await clientWrapperUnderTest.createLead(expectedLead);
    expect(sfdcClientStub.sobject).to.have.been.calledWith('Lead');
    expect(sobjectStub.create).to.have.been.calledWith(expectedLead);
    expect(actualResult).to.equal(expectedResult);
  });

  it('createLead:apiError', () => {
    const expectedLead = { email: 'test@example.com' };
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.create.callsArgWith(1, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.createLead(expectedLead))
      .to.be.rejectedWith(anError);
  });

  it('createLead:apiThrows', async () => {
    const expectedLead = { email: 'test@example.com' };
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.create.throws(anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.createLead(expectedLead))
      .to.be.rejectedWith(anError);
  });

  it('findLeadByEmail', (done) => {
    const expectedEmail = 'test@example.com';
    const expectedField = 'Id';

    // Set up test instance.
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    clientWrapperUnderTest.findLeadByEmail(expectedEmail, expectedField);
    setTimeout(() => {
      expect(sfdcClientStub.sobject).to.have.been.calledWith('Lead');
      expect(sobjectStub.findOne).to.have.been.calledWith({ Email: expectedEmail }, [expectedField]);
      done();
    }, 1)
  });

  it('findLeadByEmail:apiError', () => {
    const expectedEmail = 'test@example.com';
    const expectedField = 'Id';
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.findOne.callsArgWith(2, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.findLeadByEmail(expectedEmail, expectedField))
      .to.be.rejectedWith(anError);
  });

  it('findLeadByEmail:apiThrows', () => {
    const expectedEmail = 'test@example.com';
    const expectedField = 'Id';
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.findOne.throws(anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.findLeadByEmail(expectedEmail, expectedField))
      .to.be.rejectedWith(anError);
  });

  it('deleteLeadByEmail', (done) => {
    const expectedEmail = 'test@example.com';
    const expectedRecord = {Id: 'xyz123'};

    // Set up the test instance.
    sobjectStub.findOne.callsArgWith(2, null, expectedRecord);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    clientWrapperUnderTest.deleteLeadByEmail(expectedEmail);
    setTimeout(() => {
      expect(sfdcClientStub.sobject).to.have.been.calledWith('Lead');
      expect(sobjectStub.delete).to.have.been.calledWith(expectedRecord.Id);
      done();
    }, 1);
  });

  it('deleteLeadByEmail:noLeadFound', () => {
    const expectedEmail = 'test@example.com';
    const emptyRecord = {};

    // Set up the test instance.
    sobjectStub.findOne.callsArgWith(2, null, emptyRecord);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteLeadByEmail(expectedEmail))
      .to.be.rejected;
  });

  it('deleteLeadByEmail:apiError', () => {
    const expectedEmail = 'test@example.com';
    const expectedRecord = {Id: 'xyz123'};
    const anError = new Error('An API Error');

    // Set up the test instance.
    sobjectStub.findOne.callsArgWith(2, null, expectedRecord);
    sobjectStub.delete.callsArgWith(1, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteLeadByEmail(expectedEmail))
      .to.be.rejectedWith(anError);
  });

  it('deleteLeadByEmail:apiThrows', () => {
    const expectedEmail = 'test@example.com';
    const expectedRecord = {Id: 'xyz123'};
    const anError = new Error('An API Error');

    // Set up the test instance.
    sobjectStub.findOne.callsArgWith(2, null, expectedRecord);
    sobjectStub.delete.throws(anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteLeadByEmail(expectedEmail))
      .to.be.rejectedWith(anError);
  });

});
