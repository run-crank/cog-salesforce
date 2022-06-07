import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { CachingClientWrapper } from '../../src/client/caching-client-wrapper';

chai.use(sinonChai);

describe('CachingClientWrapper', () => {
  const expect = chai.expect;
  let cachingClientWrapperUnderTest: CachingClientWrapper;
  let clientWrapperStub: any;
  let redisClientStub: any;
  let idMap: any;

  beforeEach(() => {
    clientWrapperStub = {
      findContactByEmail: sinon.spy(),
      deleteContactByEmail: sinon.spy(),
      findAccountByIdentifier: sinon.spy(),
      deleteAccountByIdentifier: sinon.spy(),
      findOpportunityByIdentifier: sinon.spy(),
      deleteOpportunityByIdentifier: sinon.spy(),
      findLeadByEmail: sinon.spy(),
      deleteLeadByEmail: sinon.spy(),
      findCCIOById: sinon.spy(),
      findCampaignById: sinon.spy(),
      findCampaignMemberByEmailAndCampaignId: sinon.spy(),
      findObjectById: sinon.spy(),
      findObjectByField: sinon.spy(),
      updateObject: sinon.spy(),
      deleteObjectById: sinon.spy(),
      createContact: sinon.spy(),
      createAccount: sinon.spy(),
      createOpportunity: sinon.spy(),
      createLead: sinon.spy(),
      createObject: sinon.spy(),
      findObjectByFields: sinon.spy(),
      findObjectsbyFields: sinon.spy(),
      soqlSelectAllMayBeTooBig: sinon.spy(),
    };

    redisClientStub = {
      get: sinon.spy(),
      setex: sinon.spy(),
      del: sinon.spy(),
    };

    idMap = {
      requestId: '1',
      scenarioId: '2',
      requestorId: '3',
    };
  });

  it('findContactByEmail using original function', (done) => {
    const expectedEmail = 'test@example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.findContactByEmail(expectedEmail);

    setTimeout(() => {
      expect(clientWrapperStub.soqlSelectAllMayBeTooBig).to.have.been.calledWith('Contact');
      expect(clientWrapperStub.findContactByEmail).to.have.been.calledWith(expectedEmail);
      done();
    });
  });

  it('findContactByEmail using cache', (done) => {
    const expectedEmail = 'test@example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns('"expectedCachedValue"');
    let actualCachedValue: string;
    (async () => {
      actualCachedValue = await cachingClientWrapperUnderTest.findContactByEmail(expectedEmail);
    })();

    setTimeout(() => {
      expect(clientWrapperStub.findContactByEmail).to.not.have.been.called;
      expect(actualCachedValue).to.equal('expectedCachedValue');
      done();
    });
  });

  it('deleteContactByEmail', (done) => {
    const expectedEmail = 'test@example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.deleteContactByEmail(expectedEmail);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.deleteContactByEmail).to.have.been.calledWith(expectedEmail);
      done();
    });
  });

  it('findAccountByIdentifier using original function', (done) => {
    const expectedField = 'testField';
    const expectedId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.findAccountByIdentifier(expectedField, expectedId);

    setTimeout(() => {
      expect(clientWrapperStub.soqlSelectAllMayBeTooBig).to.have.been.calledWith('Account');
      expect(clientWrapperStub.findAccountByIdentifier).to.have.been.calledWith(expectedField, expectedId);
      done();
    });
  });

  it('findAccountByIdentifier using cache', (done) => {
    const expectedField = 'testField';
    const expectedId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns('"expectedCachedValue"');
    let actualCachedValue: any;
    (async () => {
      actualCachedValue = await cachingClientWrapperUnderTest.findAccountByIdentifier(expectedField, expectedId);
    })();

    setTimeout(() => {
      expect(clientWrapperStub.findAccountByIdentifier).to.not.have.been.called;
      expect(actualCachedValue).to.equal('expectedCachedValue');
      done();
    });
  });

  it('deleteAccountByIdentifier', (done) => {
    const expectedField = 'testField';
    const expectedId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.deleteAccountByIdentifier(expectedField, expectedId);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.deleteAccountByIdentifier).to.have.been.calledWith(expectedField, expectedId);
      done();
    });
  });

  it('findOpportunityByIdentifier using original function', (done) => {
    const expectedField = 'testField';
    const expectedId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.findOpportunityByIdentifier(expectedField, expectedId);

    setTimeout(() => {
      expect(clientWrapperStub.soqlSelectAllMayBeTooBig).to.have.been.calledWith('Opportunity');
      expect(clientWrapperStub.findOpportunityByIdentifier).to.have.been.calledWith(expectedField, expectedId);
      done();
    });
  });

  it('findOpportunityByIdentifier using cache', (done) => {
    const expectedField = 'testField';
    const expectedId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns('"expectedCachedValue"');
    let actualCachedValue: any;
    (async () => {
      actualCachedValue = await cachingClientWrapperUnderTest.findOpportunityByIdentifier(expectedField, expectedId);
    })();

    setTimeout(() => {
      expect(clientWrapperStub.findOpportunityByIdentifier).to.not.have.been.called;
      expect(actualCachedValue).to.equal('expectedCachedValue');
      done();
    });
  });

  it('deleteOpportunityByIdentifier', (done) => {
    const expectedField = 'testField';
    const expectedId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.deleteOpportunityByIdentifier(expectedField, expectedId);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.deleteOpportunityByIdentifier).to.have.been.calledWith(expectedField, expectedId);
      done();
    });
  });

  it('findLeadByEmail using original function', (done) => {
    const expectedEmail = 'test@example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.findLeadByEmail(expectedEmail);

    setTimeout(() => {
      expect(clientWrapperStub.soqlSelectAllMayBeTooBig).to.have.been.calledWith('Lead');
      expect(clientWrapperStub.findLeadByEmail).to.have.been.calledWith(expectedEmail);
      done();
    });
  });

  it('findLeadByEmail using cache', (done) => {
    const expectedEmail = 'test@example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub();
    cachingClientWrapperUnderTest.getAsync.returns('"expectedCachedValue"');
    let actualCachedValue: string;
    (async () => {
      actualCachedValue = await cachingClientWrapperUnderTest.findLeadByEmail(expectedEmail);
    })();

    setTimeout(() => {
      expect(clientWrapperStub.findLeadByEmail).to.not.have.been.called;
      expect(actualCachedValue).to.equal('expectedCachedValue');
      done();
    });
  });

  it('deleteLeadByEmail', (done) => {
    const expectedEmail = 'test@example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.deleteLeadByEmail(expectedEmail);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.deleteLeadByEmail).to.have.been.calledWith(expectedEmail);
      done();
    });
  });

  it('findCCIOById using original function', (done) => {
    const expectedId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.findCCIOById(expectedId);

    setTimeout(() => {
      expect(clientWrapperStub.soqlSelectAllMayBeTooBig).to.have.been.calledWith('LeanData__CC_Inserted_Object__c');
      expect(clientWrapperStub.findCCIOById).to.have.been.calledWith(expectedId);
      done();
    });
  });

  it('findCCIOById using cache', (done) => {
    const expectedId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub();
    cachingClientWrapperUnderTest.getAsync.returns('"expectedCachedValue"');
    let actualCachedValue: string;
    (async () => {
      actualCachedValue = await cachingClientWrapperUnderTest.findCCIOById(expectedId);
    })();

    setTimeout(() => {
      expect(clientWrapperStub.findCCIOById).to.not.have.been.called;
      expect(actualCachedValue).to.equal('expectedCachedValue');
      done();
    });
  });

  it('findCampaignById using original function', (done) => {
    const expectedId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.findCampaignById(expectedId);

    setTimeout(() => {
      expect(clientWrapperStub.soqlSelectAllMayBeTooBig).to.have.been.calledWith('Campaign');
      expect(clientWrapperStub.findCampaignById).to.have.been.calledWith(expectedId);
      done();
    });
  });

  it('findCampaignById using cache', (done) => {
    const expectedId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub();
    cachingClientWrapperUnderTest.getAsync.returns('"expectedCachedValue"');
    let actualCachedValue: string;
    (async () => {
      actualCachedValue = await cachingClientWrapperUnderTest.findCampaignById(expectedId);
    })();

    setTimeout(() => {
      expect(clientWrapperStub.findCampaignById).to.not.have.been.called;
      expect(actualCachedValue).to.equal('expectedCachedValue');
      done();
    });
  });

  it('findCampaignMemberByEmailAndCampaignId using original function', (done) => {
    const expectedEmail = 'test@example.com';
    const expectedCampaignId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.findCampaignMemberByEmailAndCampaignId(expectedEmail, expectedCampaignId);

    setTimeout(() => {
      expect(clientWrapperStub.soqlSelectAllMayBeTooBig).to.have.been.calledWith('CampaignMember');
      expect(clientWrapperStub.findCampaignMemberByEmailAndCampaignId).to.have.been.calledWith(expectedEmail, expectedCampaignId);
      done();
    });
  });

  it('findCampaignMemberByEmailAndCampaignId using cache', (done) => {
    const expectedEmail = 'test@example.com';
    const expectedCampaignId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub();
    cachingClientWrapperUnderTest.getAsync.returns('"expectedCachedValue"');
    let actualCachedValue: string;
    (async () => {
      actualCachedValue = await cachingClientWrapperUnderTest.findCampaignMemberByEmailAndCampaignId(expectedEmail, expectedCampaignId);
    })();

    setTimeout(() => {
      expect(clientWrapperStub.findCampaignMemberByEmailAndCampaignId).to.not.have.been.called;
      expect(actualCachedValue).to.equal('expectedCachedValue');
      done();
    });
  });

  it('findObjectById using original function', (done) => {
    const expectedObjName = 'Test';
    const expectedId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.findObjectById(expectedObjName, expectedId);

    setTimeout(() => {
      expect(clientWrapperStub.findObjectById).to.have.been.calledWith(expectedObjName, expectedId);
      done();
    });
  });

  it('findObjectById using cache', (done) => {
    const expectedObjName = 'Test';
    const expectedId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub();
    cachingClientWrapperUnderTest.getAsync.returns('"expectedCachedValue"');
    let actualCachedValue: string;
    (async () => {
      actualCachedValue = await cachingClientWrapperUnderTest.findObjectById(expectedObjName, expectedId);
    })();

    setTimeout(() => {
      expect(clientWrapperStub.findObjectById).to.not.have.been.called;
      expect(actualCachedValue).to.equal('expectedCachedValue');
      done();
    });
  });

  it('findObjectByField using original function', (done) => {
    const expectedObjName = 'Test';
    const expectedField = 'testField';
    const expectedId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.findObjectByField(expectedObjName, expectedField, expectedId);

    setTimeout(() => {
      expect(clientWrapperStub.findObjectByField).to.have.been.calledWith(expectedObjName, expectedField, expectedId);
      done();
    });
  });

  it('findObjectByField using cache', (done) => {
    const expectedObjName = 'Test';
    const expectedField = 'testField';
    const expectedId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns('"expectedCachedValue"');
    let actualCachedValue: any;
    (async () => {
      actualCachedValue = await cachingClientWrapperUnderTest.findObjectByField(expectedObjName, expectedField, expectedId);
    })();

    setTimeout(() => {
      expect(clientWrapperStub.findObjectByField).to.not.have.been.called;
      expect(actualCachedValue).to.equal('expectedCachedValue');
      done();
    });
  });

  it('updateObject using original function', (done) => {
    const expectedObjName = 'Test';
    const expectedObj = {a: 1};
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.updateObject(expectedObjName, expectedObj);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.updateObject).to.have.been.calledWith(expectedObjName, expectedObj);
      done();
    });
  });

  it('deleteObjectById using original function', (done) => {
    const expectedObjName = 'Test';
    const expectedId = '123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.deleteObjectById(expectedObjName, expectedId);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.deleteObjectById).to.have.been.calledWith(expectedObjName, expectedId);
      done();
    });
  });

  it('createContact using original function', (done) => {
    const exampleObj = {a: 1};
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.createContact(exampleObj);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.createContact).to.have.been.calledWith(exampleObj);
      done();
    });
  });

  it('createAccount using original function', (done) => {
    const exampleObj = {a: 1};
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.createAccount(exampleObj);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.createAccount).to.have.been.calledWith(exampleObj);
      done();
    });
  });

  it('createOpportunity using original function', (done) => {
    const exampleObj = {a: 1};
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.createOpportunity(exampleObj);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.createOpportunity).to.have.been.calledWith(exampleObj);
      done();
    });
  });

  it('createLead using original function', (done) => {
    const exampleObj = {a: 1};
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.createLead(exampleObj);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.createLead).to.have.been.calledWith(exampleObj);
      done();
    });
  });

  it('createObject using original function', (done) => {
    const exampleObj = {a: 1};
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.createObject('test', exampleObj);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.createObject).to.have.been.calledWith('test', exampleObj);
      done();
    });
  });

  it('findObjectByFields using original function', (done) => {
    const exampleObj = {a: 1};
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.findObjectByFields('test', exampleObj);

    expect(clientWrapperStub.findObjectByFields).to.have.been.calledWith('test', exampleObj);
    done();
  });

  it('findObjectsbyFields using original function', (done) => {
    const exampleObj = {a: 1};
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.findObjectsbyFields('test', exampleObj);

    expect(clientWrapperStub.findObjectsbyFields).to.have.been.calledWith('test', exampleObj);
    done();
  });

  it('getCache', (done) => {
    redisClientStub.get = sinon.stub().yields();
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getCache('expectedKey');

    setTimeout(() => {
      expect(redisClientStub.get).to.have.been.calledWith('expectedKey');
      done();
    });
  });

  it('setCache', (done) => {
    redisClientStub.setex = sinon.stub().yields(); 
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getCache = sinon.stub().returns(null);
    cachingClientWrapperUnderTest.cachePrefix = 'testPrefix';
    cachingClientWrapperUnderTest.setCache('expectedKey', 'expectedValue');

    setTimeout(() => {
      expect(redisClientStub.setex).to.have.been.calledWith('expectedKey', 55, '"expectedValue"');
      expect(redisClientStub.setex).to.have.been.calledWith('cachekeys|testPrefix', 55, '["expectedKey"]');
      done();
    });
  });

  it('delCache', (done) => {
    redisClientStub.del = sinon.stub().yields();
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.delCache('expectedKey');

    setTimeout(() => {
      expect(redisClientStub.del).to.have.been.calledWith('expectedKey');
      done();
    });
  });

  it('clearCache', (done) => {
    redisClientStub.del = sinon.stub().yields();
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.cachePrefix = 'testPrefix';
    cachingClientWrapperUnderTest.getCache = sinon.stub().returns(['testKey1', 'testKey2'])
    cachingClientWrapperUnderTest.clearCache();

    setTimeout(() => {
      expect(redisClientStub.del).to.have.been.calledWith('testKey1');
      expect(redisClientStub.del).to.have.been.calledWith('testKey2');
      expect(redisClientStub.setex).to.have.been.calledWith('cachekeys|testPrefix');
      done();
    });
  });

});
