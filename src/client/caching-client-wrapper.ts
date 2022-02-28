import { ClientWrapper } from '../client/client-wrapper';
import { promisify } from 'util';
​​
class CachingClientWrapper {
  // cachePrefix is scoped to the specific scenario, request, and requestor
  public cachePrefix = `${this.idMap.scenarioId}${this.idMap.requestorId}`;

  constructor(private client: ClientWrapper, public redisClient: any, public idMap: any) {
    this.redisClient = redisClient;
    this.idMap = idMap;
  }

  // Contact aware methods
  // -------------------------------------------------------------------

  public async findContactByEmail(email: string, alwaysRetrieve: string[] = []) {
    const mayGenerateBadRequest = await this.client.soqlSelectAllMayBeTooBig('Contact');
    if (mayGenerateBadRequest) {
      return await this.client.findContactByEmail(email, alwaysRetrieve, true);
    }
    const cachekey = `Salesforce|Contact|${email}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.findContactByEmail(email, alwaysRetrieve);
      if (result) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  public async createContact(contact) {
    await this.clearCache();
    return await this.client.createContact(contact);
  }

  public async deleteContactByEmail(email: string) {
    await this.clearCache();
    return await this.client.deleteContactByEmail(email);
  }

  // Account aware methods
  // -------------------------------------------------------------------

  public async findAccountByIdentifier(idField: string, identifier: string, alwaysRetrieve: string[] = []): Promise<Record<string, any>[]> {
    const mayGenerateBadRequest = await this.client.soqlSelectAllMayBeTooBig('Account');
    if (mayGenerateBadRequest) {
      return await this.client.findAccountByIdentifier(idField, identifier, alwaysRetrieve, true);
    }
    const cachekey = `Salesforce|Account|${idField}${identifier}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.findAccountByIdentifier(idField, identifier, alwaysRetrieve);
      if (result) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  public async createAccount(account) {
    await this.clearCache();
    return await this.client.createAccount(account);
  }

  public async deleteAccountByIdentifier(idField: string, identifier: string) {
    await this.clearCache();
    return await this.client.deleteAccountByIdentifier(idField, identifier);
  }

  // Opportunity aware methods
  // -------------------------------------------------------------------

  public async findOpportunityByIdentifier(idField: string, identifier: string, alwaysRetrieve: string[] = []): Promise<Record<string, any>[]> {
    const mayGenerateBadRequest = await this.client.soqlSelectAllMayBeTooBig('Opportunity');
    if (mayGenerateBadRequest) {
      return await this.client.findOpportunityByIdentifier(idField, identifier, alwaysRetrieve, true);
    }
    const cachekey = `Salesforce|Opportunity|${idField}${identifier}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.findOpportunityByIdentifier(idField, identifier, alwaysRetrieve);
      if (result) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  public async createOpportunity(opportunity: Record<string, any>) {
    await this.clearCache();
    return await this.client.createOpportunity(opportunity);
  }

  public async deleteOpportunityByIdentifier(idField: string, identifier: string) {
    await this.clearCache();
    return await this.client.deleteOpportunityByIdentifier(idField, identifier);
  }

  // Lead aware methods
  // -------------------------------------------------------------------

  public async findLeadByEmail(email: string, alwaysRetrieve: string[] = []) {
    const mayGenerateBadRequest = await this.client.soqlSelectAllMayBeTooBig('Lead');
    if (mayGenerateBadRequest) {
      return await this.client.findLeadByEmail(email, alwaysRetrieve, true);
    }
    const cachekey = `Salesforce|Lead|${email}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.findLeadByEmail(email, alwaysRetrieve);
      if (result) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  public async createLead(lead: Record<string, any>) {
    await this.clearCache();
    return await this.client.createLead(lead);
  }

  public async deleteLeadByEmail(email: string) {
    await this.clearCache();
    return await this.client.deleteLeadByEmail(email);
  }

  // CCIO aware methods
  // -------------------------------------------------------------------

  public async findCCIOById(id: string, alwaysRetrieveFields: string[] = []) {
    const mayGenerateBadRequest = await this.client.soqlSelectAllMayBeTooBig('LeanData__CC_Inserted_Object__c');
    if (mayGenerateBadRequest) {
      return await this.client.findCCIOById(id, alwaysRetrieveFields, true);
    }
    const cachekey = `Salesforce|CCIO|${id}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.findCCIOById(id, alwaysRetrieveFields);
      if (result) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  // Campaign aware methods
  // -------------------------------------------------------------------

  public async findCampaignById(campaignId: string, alwaysRetrieve: string[] = []) {
    const mayGenerateBadRequest = await this.client.soqlSelectAllMayBeTooBig('Campaign');
    if (mayGenerateBadRequest) {
      return await this.client.findCampaignById(campaignId, alwaysRetrieve, true);
    }
    const cachekey = `Salesforce|Campaign|${campaignId}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.findCampaignById(campaignId, alwaysRetrieve);
      if (result) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  // Campaign Member aware methods
  // -------------------------------------------------------------------

  public async findCampaignMemberByEmailAndCampaignId(email: string, campaignId: string, alwaysRetrieve: string[] = []) {
    const mayGenerateBadRequest = await this.client.soqlSelectAllMayBeTooBig('CampaignMember');
    if (mayGenerateBadRequest) {
      return await this.client.findCampaignMemberByEmailAndCampaignId(email, campaignId, alwaysRetrieve, true);
    }
    const cachekey = `Salesforce|CampaignMember|${campaignId}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.findCampaignMemberByEmailAndCampaignId(email, campaignId, alwaysRetrieve);
      if (result) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  // Object aware methods
  // -------------------------------------------------------------------

  public async findObjectById(objName: string, id: string, alwaysRetrieve: string[] = []) {
    const cachekey = `Salesforce|Object|${id}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.findObjectById(objName, id, alwaysRetrieve);
      if (result) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  public async findObjectByField(objName: string, field: string, value: string, alwaysRetrieve: string[] = []) {
    const cachekey = `Salesforce|Object|${field}${value}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.findObjectByField(objName, field, value, alwaysRetrieve);
      if (result) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  public async createObject(objName: string, object: Record<string, any>) {
    await this.clearCache();
    return await this.client.createObject(objName, object);
  }

  public async bulkcreateObjects(objName: string, objectArray: [Record<string, any>]) {
    await this.clearCache();
    return await this.client.createObject(objName, objectArray);
  }

  public async updateObject(objName: string, object: Record<string, any>) {
    await this.clearCache();
    return await this.client.updateObject(objName, object);
  }

  public async deleteObjectById(objName: string, id: string) {
    await this.clearCache();
    return await this.client.deleteObjectById(objName, id);
  }

  // all non-cached methods, just referencing the original function
  // -------------------------------------------------------------------

  public async findObjectByFields(objName: string, fieldMap: Record<string, any>, alwaysRetrieve: string[] = []) {
    return await this.client.findObjectByFields(objName, fieldMap, alwaysRetrieve);
  }

  public async findObjectsbyFields(objName: string, fieldMap: Record<string, any>, alwaysRetrieve: string[] = []) {
    return await this.client.findObjectsbyFields(objName, fieldMap, alwaysRetrieve);
  }

  // Redis methods for get, set, and delete
  // -------------------------------------------------------------------

  // Async getter/setter
  public getAsync = promisify(this.redisClient.get).bind(this.redisClient);
  public setAsync = promisify(this.redisClient.setex).bind(this.redisClient);
  public delAsync = promisify(this.redisClient.del).bind(this.redisClient);

  public async getCache(key: string) {
    try {
      const stored = await this.getAsync(key);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (err) {
      console.log(err);
    }
  }

  public async setCache(key: string, value: any) {
    try {
      // arrOfKeys will store an array of all cache keys used in this scenario run, so it can be cleared easily
      const arrOfKeys = await this.getCache(`cachekeys|${this.cachePrefix}`) || [];
      arrOfKeys.push(key);
      await this.setAsync(key, 55, JSON.stringify(value));
      await this.setAsync(`cachekeys|${this.cachePrefix}`, 55, JSON.stringify(arrOfKeys));
    } catch (err) {
      console.log(err);
    }
  }

  public async delCache(key: string) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.log(err);
    }
  }

  public async clearCache() {
    try {
      // clears all the cachekeys used in this scenario run
      const keysToDelete = await this.getCache(`cachekeys|${this.cachePrefix}`) || [];
      if (keysToDelete.length) {
        keysToDelete.forEach(async (key: string) => await this.delAsync(key));
      }
      await this.setAsync(`cachekeys|${this.cachePrefix}`, 55, '[]');
    } catch (err) {
      console.log(err);
    }
  }

}
​
export { CachingClientWrapper as CachingClientWrapper };
