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
    sobjectStub.find = sinon.stub();
    sobjectStub.create = sinon.stub();
    sobjectStub.describe = sinon.stub();
    sobjectStub.describe.callsArgWith(0, null, {fields: []});
    sfdcClientStub = {
      login: sinon.stub(),
      sobject: sinon.stub(),
      oauth2: {
        refreshToken: sinon.stub(),
      },
    };
    sfdcClientStub.login.callsArgWith(2, null, {});
    sfdcClientStub.oauth2.refreshToken.callsArgWith(2, null, { access_token: 'anything' });
    sfdcClientStub.sobject.returns(sobjectStub);
    jsForceConstructorStub = sinon.stub();
    jsForceConstructorStub.Connection = sinon.stub();
    jsForceConstructorStub.Connection.returns(sfdcClientStub);
  });

  it('authentication:oauthAccessRefresh', () => {
    // Construct grpc metadata and assert the client was authenticated.
    const constructorArgs = {
      oauth2: {
        clientId: 'some-client-id',
        clientSecret: 'some-client-secret',
      },
      instanceUrl: 'https://na123.salesforce.com',
      accessToken: 'some.access.token',
      refreshToken: 'some.refresh.token',
    };
    metadata = new Metadata();
    metadata.add('instanceUrl', constructorArgs.instanceUrl);
    metadata.add('clientId', constructorArgs.oauth2.clientId);
    metadata.add('clientSecret', constructorArgs.oauth2.clientSecret);
    metadata.add('accessToken', constructorArgs.accessToken);
    metadata.add('refreshToken', constructorArgs.refreshToken);

    // Assert that the underlying API client was authenticated correctly.
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);
    expect(jsForceConstructorStub.Connection).to.have.been.calledWith(constructorArgs);
    expect(sfdcClientStub.oauth2.refreshToken).to.have.been.calledWith(constructorArgs.refreshToken);
  });

  it('authentication:oauthUserPass', () => {
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
    expect(jsForceConstructorStub.Connection).to.have.been.calledWith({ oauth2: oauth2Args });
    expect(sfdcClientStub.login).to.have.been.calledWith(username, password);
  });

  it('createLead', async () => {
    const expectedLead = { email: 'test@example.com' };
    const expectedResult = { Id: 'xyz123' };
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
    clientWrapperUnderTest.findLeadByEmail(expectedEmail);
    setTimeout(() => {
      expect(sfdcClientStub.sobject).to.have.been.calledWith('Lead');
      expect(sobjectStub.findOne).to.have.been.calledWith({ Email: expectedEmail });
      done();
    });
  });

  it('findLeadByEmail:apiError', () => {
    const expectedEmail = 'test@example.com';
    const expectedField = 'Id';
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.findOne.callsArgWith(2, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.findLeadByEmail(expectedEmail))
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
    expect(clientWrapperUnderTest.findLeadByEmail(expectedEmail))
      .to.be.rejectedWith(anError);
  });

  // it('deleteLeadByEmail', (done) => {
  //   const expectedEmail = 'test@example.com';
  //   const expectedRecord = { Id: 'xyz123' };

  //   // Set up the test instance.
  //   sobjectStub.findOne.callsArgWith(2, null, expectedRecord);
  //   clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

  //   // Call the method and make assertions.
  //   clientWrapperUnderTest.deleteLeadByEmail(expectedEmail);
  //   setTimeout(() => {
  //     expect(sfdcClientStub.sobject).to.have.been.calledWith('Lead');
  //     expect(sobjectStub.delete).to.have.been.calledWith(expectedRecord.Id);
  //     done();
  //   });
  // });

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
    const expectedRecord = { Id: 'xyz123' };
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
    const expectedRecord = { Id: 'xyz123' };
    const anError = new Error('An API Error');

    // Set up the test instance.
    sobjectStub.findOne.callsArgWith(2, null, expectedRecord);
    sobjectStub.delete.throws(anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteLeadByEmail(expectedEmail))
      .to.be.rejectedWith(anError);
  });

  it('createAccount', async () => {
    const expectedLead = { email: 'test@example.com' };
    const expectedResult = { Id: 'xyz123' };
    let actualResult;

    // Set up test instance.
    sobjectStub.create.callsArgWith(1, null, expectedResult);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    actualResult = await clientWrapperUnderTest.createAccount(expectedLead);
    expect(sfdcClientStub.sobject).to.have.been.calledWith('Account');
    expect(sobjectStub.create).to.have.been.calledWith(expectedLead);
    expect(actualResult).to.equal(expectedResult);
  });

  it('createAccount:apiError', () => {
    const expectedLead = { email: 'test@example.com' };
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.create.callsArgWith(1, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.createAccount(expectedLead))
      .to.be.rejectedWith(anError);
  });

  it('createAccount:apiThrows', async () => {
    const expectedLead = { email: 'test@example.com' };
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.create.throws(anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.createAccount(expectedLead))
      .to.be.rejectedWith(anError);
  });

  it('findAccountByIndentifier', (done) => {
    const sampleIdField = 'someIdField';
    const sampleIdValue = 'someIdValue';
    const sampleField = 'Id';

    // Set up test instance.
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    clientWrapperUnderTest.findAccountByIdentifier(sampleIdField, sampleIdValue);
    setTimeout(() => {
      expect(sfdcClientStub.sobject).to.have.been.calledWith('Account');
      expect(sobjectStub.find).to.have.been.calledWith({ [sampleIdField]: sampleIdValue });
      done();
    });
  });

  it('findAccountByIndentifier:apiError', () => {
    const sampleIdField = 'someIdField';
    const sampleIdValue = 'someIdValue';
    const sampleField = 'Id';
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.findOne.callsArgWith(2, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.findAccountByIdentifier(sampleIdField, sampleIdValue))
      .to.be.rejectedWith(anError);
  });

  it('findAccountByIndentifier:apiThrows', () => {
    const sampleIdField = 'someIdField';
    const sampleIdValue = 'someIdValue';
    const sampleField = 'Id';
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.findOne.throws(anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.findAccountByIdentifier(sampleIdField, sampleIdValue))
      .to.be.rejectedWith(anError);
  });

  // it('deleteAccountByIdentifier', (done) => {
  //   const sampleIdField = 'someIdField';
  //   const sampleIdValue = 'someIdValue';
  //   const sampleField = 'Id';
  //   const sampleRecord = [
  //     {
  //       Id: 'sampleId',
  //       Name: 'SampleName',
  //     },
  //   ];

  //   // Set up the test instance.
  //   sobjectStub.find.callsArgWith(2, null, sampleRecord);
  //   clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

  //   // Call the method and make assertions.
  //   clientWrapperUnderTest.deleteAccountByIdentifier(sampleIdField, sampleIdValue);
  //   setTimeout(() => {
  //     expect(sfdcClientStub.sobject).to.have.been.calledWith('Account');
  //     expect(sobjectStub.delete).to.have.been.calledWith(sampleRecord[0].Id);
  //     done();
  //   });
  // });

  it('deleteAccountByIdentifier:noAccountFound', () => {
    const sampleIdField = 'someIdField';
    const sampleIdValue = 'someIdValue';
    const emptyRecord = {};

    // Set up the test instance.
    sobjectStub.find.callsArgWith(2, null, emptyRecord);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteAccountByIdentifier(sampleIdField, sampleIdValue))
      .to.be.rejected;
  });

  it('deleteAccountByIdentifier:multipleAccountsFound', () => {
    const sampleIdField = 'someIdField';
    const sampleIdValue = 'someIdValue';
    const multipleRecord = [
      {
        Id: 'sampleId',
        Name: 'SampleName',
      },
      {
        Id: 'sampleId',
        Name: 'SampleName',
      },
      {
        Id: 'sampleId',
        Name: 'SampleName',
      },
    ];

    // Set up the test instance.
    sobjectStub.find.callsArgWith(2, null, multipleRecord);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteAccountByIdentifier(sampleIdField, sampleIdValue))
      .to.be.rejected;
  });

  it('deleteAccountByIdentifier:apiError', () => {
    const sampleIdField = 'someIdField';
    const sampleIdValue = 'someIdValue';
    const sampleRecord = [
      {
        Id: 'sampleId',
        Name: 'SampleName',
      },
    ];
    const anError = new Error('An API Error');

    // Set up the test instance.
    sobjectStub.find.callsArgWith(2, null, sampleRecord);
    sobjectStub.delete.callsArgWith(1, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteAccountByIdentifier(sampleIdField, sampleIdValue))
      .to.be.rejectedWith(anError);
  });

  it('deleteAccountByIdentifier:apiThrows', () => {
    const sampleIdField = 'someIdField';
    const sampleIdValue = 'someIdValue';
    const sampleField = 'Id';
    const sampleRecord = [
      {
        Id: 'sampleId',
        Name: 'SampleName',
      },
    ];
    const anError = new Error('An API Error');

    // Set up the test instance.
    sobjectStub.findOne.callsArgWith(2, null, sampleRecord);
    sobjectStub.delete.throws(anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteAccountByIdentifier(sampleIdField, sampleIdValue))
      .to.be.rejectedWith(anError);
  });

  it('createOpportunity', async () => {
    const expectedLead = { email: 'test@example.com' };
    const expectedResult = { Id: 'xyz123' };
    let actualResult;

    // Set up test instance.
    sobjectStub.create.callsArgWith(1, null, expectedResult);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    actualResult = await clientWrapperUnderTest.createOpportunity(expectedLead);
    expect(sfdcClientStub.sobject).to.have.been.calledWith('Opportunity');
    expect(sobjectStub.create).to.have.been.calledWith(expectedLead);
    expect(actualResult).to.equal(expectedResult);
  });

  it('createOpportunity:apiError', () => {
    const expectedLead = { email: 'test@example.com' };
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.create.callsArgWith(1, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.createOpportunity(expectedLead))
      .to.be.rejectedWith(anError);
  });

  it('createOpportunity:apiThrows', async () => {
    const expectedLead = { email: 'test@example.com' };
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.create.throws(anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.createOpportunity(expectedLead))
      .to.be.rejectedWith(anError);
  });

  it('findOpportunityByIndentifier', (done) => {
    const sampleIdField = 'someIdField';
    const sampleIdValue = 'someIdValue';
    const sampleField = 'Id';

    // Set up test instance.
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    clientWrapperUnderTest.findOpportunityByIdentifier(sampleIdField, sampleIdValue);
    setTimeout(() => {
      expect(sfdcClientStub.sobject).to.have.been.calledWith('Opportunity');
      expect(sobjectStub.find).to.have.been.calledWith({ [sampleIdField]: sampleIdValue });
      done();
    });
  });

  it('findOpportunityByIndentifier:apiError', () => {
    const sampleIdField = 'someIdField';
    const sampleIdValue = 'someIdValue';
    const sampleField = 'Id';
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.findOne.callsArgWith(2, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.findOpportunityByIdentifier(sampleIdField, sampleIdValue))
      .to.be.rejectedWith(anError);
  });

  it('findOpportunityByIndentifier:apiThrows', () => {
    const sampleIdField = 'someIdField';
    const sampleIdValue = 'someIdValue';
    const sampleField = 'Id';
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.findOne.throws(anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.findOpportunityByIdentifier(sampleIdField, sampleIdValue))
      .to.be.rejectedWith(anError);
  });

  // it('deleteOpportunityByIdentifier', (done) => {
  //   const sampleIdField = 'someIdField';
  //   const sampleIdValue = 'someIdValue';
  //   const sampleField = 'Id';
  //   const sampleRecord = [
  //     {
  //       Id: 'sampleId',
  //       Name: 'SampleName',
  //     },
  //   ];

  //   // Set up the test instance.
  //   sobjectStub.find.callsArgWith(2, null, sampleRecord);
  //   clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

  //   // Call the method and make assertions.
  //   clientWrapperUnderTest.deleteOpportunityByIdentifier(sampleIdField, sampleIdValue);
  //   setTimeout(() => {
  //     expect(sfdcClientStub.sobject).to.have.been.calledWith('Opportunity');
  //     expect(sobjectStub.delete).to.have.been.calledWith(sampleRecord[0].Id);
  //     done();
  //   });
  // });

  it('deleteOpportunityByIdentifier:noAccountFound', () => {
    const sampleIdField = 'someIdField';
    const sampleIdValue = 'someIdValue';
    const emptyRecord = {};

    // Set up the test instance.
    sobjectStub.find.callsArgWith(2, null, emptyRecord);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteOpportunityByIdentifier(sampleIdField, sampleIdValue))
      .to.be.rejected;
  });

  it('deleteOpportunityByIdentifier:multipleAccountsFound', () => {
    const sampleIdField = 'someIdField';
    const sampleIdValue = 'someIdValue';
    const multipleRecord = [
      {
        Id: 'sampleId',
        Name: 'SampleName',
      },
      {
        Id: 'sampleId',
        Name: 'SampleName',
      },
      {
        Id: 'sampleId',
        Name: 'SampleName',
      },
    ];

    // Set up the test instance.
    sobjectStub.find.callsArgWith(2, null, multipleRecord);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteOpportunityByIdentifier(sampleIdField, sampleIdValue))
      .to.be.rejected;
  });

  it('deleteOpportunityByIdentifier:apiError', () => {
    const sampleIdField = 'someIdField';
    const sampleIdValue = 'someIdValue';
    const sampleRecord = [
      {
        Id: 'sampleId',
        Name: 'SampleName',
      },
    ];
    const anError = new Error('An API Error');

    // Set up the test instance.
    sobjectStub.find.callsArgWith(2, null, sampleRecord);
    sobjectStub.delete.callsArgWith(1, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteOpportunityByIdentifier(sampleIdField, sampleIdValue))
      .to.be.rejectedWith(anError);
  });

  it('deleteOpportunityByIdentifier:apiThrows', () => {
    const sampleIdField = 'someIdField';
    const sampleIdValue = 'someIdValue';
    const sampleField = 'Id';
    const sampleRecord = [
      {
        Id: 'sampleId',
        Name: 'SampleName',
      },
    ];
    const anError = new Error('An API Error');

    // Set up the test instance.
    sobjectStub.findOne.callsArgWith(2, null, sampleRecord);
    sobjectStub.delete.throws(anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteOpportunityByIdentifier(sampleIdField, sampleIdValue))
      .to.be.rejectedWith(anError);
  });

  it('findCampaignMemberByEmailAndCampaignId', (done) => {
    const expectedEmail = 'test@example.com';
    const expectedCampaignId = 'abc123';
    const expectedField = 'Id';

    // Set up test instance.
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    clientWrapperUnderTest.findCampaignMemberByEmailAndCampaignId(expectedEmail, expectedCampaignId);
    setTimeout(() => {
      expect(sfdcClientStub.sobject).to.have.been.calledWith('CampaignMember');
      expect(sobjectStub.findOne).to.have.been.calledWith({ Email: expectedEmail, CampaignId: expectedCampaignId });
      done();
    });
  });

  it('findCampaignMemberByEmailAndCampaignId:apiError', () => {
    const expectedEmail = 'test@example.com';
    const expectedCampaignId = 'abc123';
    const expectedField = 'Id';
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.findOne.callsArgWith(2, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.findCampaignMemberByEmailAndCampaignId(expectedEmail, expectedCampaignId))
      .to.be.rejectedWith(anError);
  });

  it('findCampaignMemberByEmailAndCampaignId: apiThrows', () => {
    const expectedEmail = 'test@example.com';
    const expectedCampaignId = 'abc123';
    const expectedField = 'someField';
    const anError = new Error('An API Error');

    // Set up test instance.
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);
    sobjectStub.findOne.throws(anError);
    // Call the method and make assertions.
    clientWrapperUnderTest.findCampaignMemberByEmailAndCampaignId(expectedEmail, expectedCampaignId);

    expect(clientWrapperUnderTest.findCampaignMemberByEmailAndCampaignId(expectedEmail, expectedCampaignId))
      .to.be.rejectedWith(anError);
  });

  it('createContact', async () => {
    const expectedLead = { email: 'test@example.com' };
    const expectedResult = { Id: 'xyz123' };
    let actualResult;

    // Set up test instance.
    sobjectStub.create.callsArgWith(1, null, expectedResult);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    actualResult = await clientWrapperUnderTest.createContact(expectedLead);
    expect(sfdcClientStub.sobject).to.have.been.calledWith('Contact');
    expect(sobjectStub.create).to.have.been.calledWith(expectedLead);
    expect(actualResult).to.equal(expectedResult);
  });

  it('createContact:apiError', () => {
    const expectedLead = { email: 'test@example.com' };
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.create.callsArgWith(1, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.createContact(expectedLead))
      .to.be.rejectedWith(anError);
  });

  it('createContact:apiThrows', async () => {
    const expectedLead = { email: 'test@example.com' };
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.create.throws(anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.createContact(expectedLead))
      .to.be.rejectedWith(anError);
  });

  it('findContactByEmail', (done) => {
    const sampleEmail = 'sampleEmail';
    const sampleField = 'Id';

    // Set up test instance.
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    clientWrapperUnderTest.findContactByEmail(sampleEmail);
    setTimeout(() => {
      expect(sfdcClientStub.sobject).to.have.been.calledWith('Contact');
      expect(sobjectStub.findOne).to.have.been.calledWith({ Email: sampleEmail });
      done();
    });
  });

  it('findContactByEmail:apiError', () => {
    const sampleEmail = 'sampleEmail';
    const sampleField = 'Id';
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.findOne.callsArgWith(2, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.findContactByEmail(sampleEmail))
      .to.be.rejectedWith(anError);
  });

  it('findContactByEmail:apiThrows', () => {
    const sampleEmail = 'sampleEmail';
    const sampleField = 'Id';
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.findOne.throws(anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.findContactByEmail(sampleEmail))
      .to.be.rejectedWith(anError);
  });

  // it('deleteContactByEmail', (done) => {
  //   const sampleEmail = 'sampleEmail';
  //   const sampleRecord =
  //     {
  //       Id: 'sampleId',
  //       Name: 'SampleName',
  //     };

  //   // Set up the test instance.
  //   sobjectStub.findOne.callsArgWith(2, null, sampleRecord);
  //   clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

  //   // Call the method and make assertions.
  //   clientWrapperUnderTest.deleteContactByEmail(sampleEmail);
  //   setTimeout(() => {
  //     expect(sfdcClientStub.sobject).to.have.been.calledWith('Contact');
  //     expect(sobjectStub.delete).to.have.been.calledWith(sampleRecord.Id);
  //     done();
  //   });
  // });

  it('deleteContactByEmail:noAccountFound', () => {
    const sampleEmail = 'sampleEmail';
    const emptyRecord = {};

    // Set up the test instance.
    sobjectStub.find.callsArgWith(2, null, emptyRecord);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteContactByEmail(sampleEmail))
      .to.be.rejected;
  });

  it('deleteContactByEmail:apiError', () => {
    const sampleEmail = 'sampleEmail';
    const sampleRecord = [
      {
        Id: 'sampleId',
        Name: 'SampleName',
      },
    ];
    const anError = new Error('An API Error');

    // Set up the test instance.
    sobjectStub.find.callsArgWith(2, null, sampleRecord);
    sobjectStub.delete.callsArgWith(1, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteContactByEmail(sampleEmail))
      .to.be.rejectedWith(anError);
  });

  it('deleteContactByEmail:apiThrows', () => {
    const sampleEmail = 'sampleEmail';
    const sampleRecord = [
      {
        Id: 'sampleId',
        Name: 'SampleName',
      },
    ];
    const anError = new Error('An API Error');

    // Set up the test instance.
    sobjectStub.findOne.callsArgWith(2, null, sampleRecord);
    sobjectStub.delete.throws(anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteContactByEmail(sampleEmail))
      .to.be.rejectedWith(anError);
  });

  it('createObject', async () => {
    const expectedLead = { email: 'test@example.com' };
    const expectedResult = { Id: 'xyz123' };
    const sampleObjectName = 'anyObject';
    let actualResult;

    // Set up test instance.
    sobjectStub.create.callsArgWith(1, null, expectedResult);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    actualResult = await clientWrapperUnderTest.createObject(sampleObjectName, expectedLead);
    expect(sfdcClientStub.sobject).to.have.been.calledWith(sampleObjectName);
    expect(sobjectStub.create).to.have.been.calledWith(expectedLead);
    expect(actualResult).to.equal(expectedResult);
  });

  it('createAccount:apiError', () => {
    const expectedLead = { email: 'test@example.com' };
    const sampleObjectName = 'anyObject';
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.create.callsArgWith(1, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.createObject(sampleObjectName, expectedLead))
      .to.be.rejectedWith(anError);
  });

  it('createObject:apiThrows', async () => {
    const expectedLead = { email: 'test@example.com' };
    const sampleObjectName = 'anyObject';
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.create.throws(anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.createObject(sampleObjectName, expectedLead))
      .to.be.rejectedWith(anError);
  });

  it('findObjectById', (done) => {
    const sampleIdValue = 'someIdValue';
    const sampleObjectName = 'anyObject';

    // Set up test instance.
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    clientWrapperUnderTest.findObjectById(sampleObjectName, sampleIdValue);
    setTimeout(() => {
      expect(sfdcClientStub.sobject).to.have.been.calledWith(sampleObjectName);
      expect(sobjectStub.findOne).to.have.been.calledWith({ Id: sampleIdValue });
      done();
    });
  });

  it('findObjectById:apiError', () => {
    const sampleIdValue = 'someIdValue';
    const sampleObjectName = 'anyObject';
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.findOne.callsArgWith(2, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.findObjectById(sampleObjectName, sampleIdValue))
      .to.be.rejectedWith(anError);
  });

  it('findObjectById:apiThrows', () => {
    const sampleIdValue = 'someIdValue';
    const sampleObjectName = 'anyObject';
    const anError = new Error('An API Error');

    // Set up test instance.
    sobjectStub.findOne.throws(anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.findObjectById(sampleObjectName, sampleIdValue))
      .to.be.rejectedWith(anError);
  });

  it('deleteObjectById', (done) => {
    const sampleObjectName = 'anyObject';
    const sampleIdValue = 'someIdValue';

    // Set up the test instance.
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    clientWrapperUnderTest.deleteObjectById(sampleObjectName, sampleIdValue);
    setTimeout(() => {
      expect(sfdcClientStub.sobject).to.have.been.calledWith(sampleObjectName);
      expect(sobjectStub.delete).to.have.been.calledWith(sampleIdValue);
      done();
    });
  });

  it('deleteAccountByIdentifier:noAccountFound', () => {
    const sampleObjectName = 'anyObject';
    const sampleIdValue = 'someIdValue';

    // Set up the test instance.
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteObjectById(sampleObjectName, sampleIdValue))
      .to.be.rejected;
  });

  it('deleteAccountByIdentifier:apiError', () => {
    const sampleObjectName = 'anyObject';
    const sampleIdValue = 'someIdValue';
    const anError = new Error('An API Error');

    // Set up the test instance.
    sobjectStub.delete.callsArgWith(1, anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteObjectById(sampleObjectName, sampleIdValue))
      .to.be.rejectedWith(anError);
  });

  it('deleteAccountByIdentifier:apiThrows', () => {
    const sampleObjectName = 'anyObject';
    const sampleIdValue = 'someIdValue';
    const anError = new Error('An API Error');

    // Set up the test instance.
    sobjectStub.delete.throws(anError);
    clientWrapperUnderTest = new ClientWrapper(metadata, jsForceConstructorStub);

    // Call the method and make assertions.
    expect(clientWrapperUnderTest.deleteObjectById(sampleObjectName, sampleIdValue))
      .to.be.rejectedWith(anError);
  });

});
