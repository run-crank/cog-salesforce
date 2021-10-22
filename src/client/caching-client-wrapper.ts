import { ClientWrapper } from '../client/client-wrapper';
import { promisify } from 'util';
​​
class CachingClientWrapper {
  // cachePrefix is scoped to the specific scenario, request, and requestor
  public cachePrefix = `${this.idMap.requestId}${this.idMap.scenarioId}${this.idMap.requestorId}Salesforce`;

  constructor(private client: ClientWrapper, public redisClient: any, public idMap: any) {
    this.redisClient = redisClient;
    this.idMap = idMap;
  }

  // Contact aware methods
  // -------------------------------------------------------------------

  public async findContactByEmail(email: string, alwaysRetrieve: string[] = []) {
    const cachekey = `${this.cachePrefix}Contact${email}`;
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

  public async deleteContactByEmail(email: string) {
    await this.delCache(`${this.cachePrefix}Contact${email}`);
    return await this.client.deleteContactByEmail(email);
  }

  // Account aware methods
  // -------------------------------------------------------------------

  public async findAccountByIdentifier(idField: string, identifier: string, alwaysRetrieve: string[] = []): Promise<Record<string, any>[]> {
    const cachekey = `${this.cachePrefix}Account${idField}${identifier}`;
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

  public async deleteAccountByIdentifier(idField: string, identifier: string) {
    await this.delCache(`${this.cachePrefix}Account${idField}${identifier}`);
    return await this.client.deleteAccountByIdentifier(idField, identifier);
  }

  // Opportunity aware methods
  // -------------------------------------------------------------------

  public async findOpportunityByIdentifier(idField: string, identifier: string, alwaysRetrieve: string[] = []): Promise<Record<string, any>[]> {
    const cachekey = `${this.cachePrefix}Opportunity${idField}${identifier}`;
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

  public async deleteOpportunityByIdentifier(idField: string, identifier: string) {
    await this.delCache(`${this.cachePrefix}Opportunity${idField}${identifier}`);
    return await this.client.deleteOpportunityByIdentifier(idField, identifier);
  }

  // Lead aware methods
  // -------------------------------------------------------------------

  public async findLeadByEmail(email: string, alwaysRetrieve: string[] = []) {
    const cachekey = `${this.cachePrefix}Lead${email}`;
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

  public async deleteLeadByEmail(email: string) {
    await this.delCache(`${this.cachePrefix}Lead${email}`);
    return await this.client.deleteLeadByEmail(email);
  }

  // CCIO aware methods
  // -------------------------------------------------------------------

  public async findCCIOById(id: string, alwaysRetrieveFields: string[] = []) {
    const cachekey = `${this.cachePrefix}CCIO${id}`;
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
    const cachekey = `${this.cachePrefix}Campaign${campaignId}`;
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
    const cachekey = `${this.cachePrefix}CampaignMember${campaignId}`;
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
    const cachekey = `${this.cachePrefix}Object${id}`;
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
    const cachekey = `${this.cachePrefix}Object${field}${value}`;
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

  public async createContact(contact) {
    return await this.client.createContact(contact);
  }

  public async createAccount(account) {
    return await this.client.createAccount(account);
  }

  public async createOpportunity(opportunity: Record<string, any>) {
    return await this.client.createOpportunity(opportunity);
  }

  public async createLead(lead: Record<string, any>) {
    return await this.client.createLead(lead);
  }

  public async createObject(objName: string, object: Record<string, any>) {
    return await this.client.createObject(objName, object);
  }

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
      const arrOfKeys = await this.getCache(this.cachePrefix) || [];
      arrOfKeys.push(key);
      await this.setAsync(key, 600, JSON.stringify(value));
      await this.setAsync(this.cachePrefix, 600, JSON.stringify(arrOfKeys));
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
      const keysToDelete = await this.getCache(this.cachePrefix) || [];
      // get the keys from Salesloft
      const salesloftKeys = await this.getCache(`${this.cachePrefix.slice(0, -10)}Salesloft`) || [];
      keysToDelete.push(...salesloftKeys);
      if (keysToDelete.length) {
        keysToDelete.forEach((key: string) => this.delAsync(key));
      }
      await this.setAsync(this.cachePrefix, 600, '[]');
      await this.setAsync(`${this.cachePrefix.slice(0, -10)}Salesloft`, 600, '[]');
    } catch (err) {
      console.log(err);
    }
  }

}
​
export { CachingClientWrapper as CachingClientWrapper };
