import * as jsforce from 'jsforce';

export class ObjectAwareMixin {
  objectDescriptions: Record<string, jsforce.DescribeSObjectResult>;
  clientReady: Promise<boolean>;
  client: jsforce.Connection;

  /**
   * Creates a Salesforce Object.
   *
   * @param {string} objName - Salesforce object name.
   * @param {Record<string, any>} object - The Object record to create.
   */
  public async createObject(objName: string, object: Record<string, any>): Promise<jsforce.SuccessResult> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.sobject(objName).create(object, (err, result: any) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(result);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Retrieves a single Object record for a given email address.
   *
   * @param {String} objName - Salesforce object name.
   * @param {String} id - id of the Object record to retrieve.
   * @param {String[]} alwaysRetrieve - An optional list of fields that should
   *   always be retrieved for the given object.
   */
  public async findObjectById(objName: string, id: string, alwaysRetrieve: string[] = []): Promise<Record<string, any>> {
    return this.findObjectByField(objName, 'Id', id, alwaysRetrieve);
  }

  /**
   * Retrieves a single Object record based on a given field/value.
   *
   * @param objName - Salesforce object name.
   * @param field - Salesforce object field used to query for the object.
   * @param value - Value of the Salesforce object field to query by.
   * @param alwaysRetrieve - An optional list of fields that should always be
   *   retrieved for the given object.
   */
  public async findObjectByField(objName: string, field: string, value: string, alwaysRetrieve: string[] = []): Promise<Record<string, any>> {
    return this.findObjectByFields(objName, { [field]: value }, alwaysRetrieve);
  }

  /**
   * Retrieves a single Object record based on a given map of fields/values.
   *
   * @param objName - Salesforce object name.
   * @param fieldMap - A map of Salesforce object fields to values.
   * @param alwaysRetrieve - An optional array of fields that should always be
   *   retrieved (only ever used if the underlying object has an unexpectedly
   *   large number of fields).
   */
  public async findObjectByFields(objName: string, fieldMap: Record<string, any>, alwaysRetrieve: string[] = []): Promise<Record<string, any>> {
    const mayGenerateBadRequest = await this.soqlSelectAllMayBeTooBig(objName);
    let retrieveFields = null;

    // If the request generated may be too large, only pull standard fields, as
    // well as any additional fields that were specified.
    if (mayGenerateBadRequest) {
      const description = await this.describeObject(objName);
      // Apply any fields provided in alwaysRetrieve and dedupe.
      retrieveFields = Array.from(new Set(alwaysRetrieve.concat(description.fields.filter(f => !f.custom).map(f => f.name))));
    }

    return new Promise((resolve, reject) => {
      try {
        this.client.sobject(objName).findOne(fieldMap, retrieveFields, (err, record) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(record);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Retrieves a list of Object records based on a given map of fields/values.
   *
   * @param objName - Salesforce object name.
   * @param fieldMap - A map of Salesforce object fields to values.
   * @param alwaysRetrieve - An optional list of fields that should always be
   *   retrieved when finding objects of this type (only ever used if the
   *   underlying object type has an unexpectedly large number of fields).
   */
  public async findObjectsbyFields(objName: string, fieldMap: Record<string, any>, alwaysRetrieve: string[] = []): Promise<Record<string, any>[]> {
    const mayGenerateBadRequest = await this.soqlSelectAllMayBeTooBig(objName);
    let retrieveFields = null;

    // If the request generated may be too large, only pull standard fields, as
    // well as any additional fields that were specified.
    if (mayGenerateBadRequest) {
      const description = await this.describeObject(objName);
      // Apply any fields provided in alwaysRetrieve and dedupe.
      retrieveFields = Array.from(new Set(alwaysRetrieve.concat(description.fields.filter(f => !f.custom).map(f => f.name))));
    }

    return new Promise((resolve, reject) => {
      try {
        this.client.sobject(objName).find(fieldMap, retrieveFields, (err, record) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(record);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Updates a Salesforce Object.
   *
   * @param {string} objName - Salesforce object name.
   * @param {Record<string, any>} object - The Object record to update.
   */
  public async updateObject(objName: string, object: Record<string, any>): Promise<Record<string, any>> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.sobject(objName.toLowerCase()).update(object, (err, result: any) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(result);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Deletes the object associated with the given email address.
   *
   * @param {String} objName -  Salesforce object name.
   * @param {String} id - id of the Object record to be deleted.
   */
  public async deleteObjectById(objName: string, id: string): Promise<jsforce.SuccessResult> {
    await this.clientReady;
    return new Promise(async (resolve, reject) => {
      try {
        this.client.sobject(objName).delete(id, (err, result: any) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(result);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Retrieves (and caches, temporarily in memory) the complete description for
   * a given object type.
   *
   * @param objName - The name of the Object whose description/definition
   *   should be returned.
   */
  public async describeObject(objName: string): Promise<jsforce.DescribeSObjectResult> {
    // This safely reduces the number of API calls that might have to be made
    // in object field check steps, but is an imcomplete solution.
    // @todo Incorporate true caching based on https://github.com/run-crank/cli/pull/40
    if (!this.objectDescriptions || !this.objectDescriptions[objName]) {
      this.objectDescriptions = this.objectDescriptions || {};

      await this.clientReady;
      this.objectDescriptions[objName] = await new Promise((resolve, reject) => {
        try {
          this.client.sobject(objName).describe((err, result) => {
            if (err) {
              return reject(err);
            }

            resolve(result);
          });
        } catch (e) {
          reject(e);
        }
      });
    }

    return this.objectDescriptions[objName];
  }

  /**
   * Returns whether or not a select all on the given object type might result
   * in a REST API query URL that is too long for Salesforce to handle.
   *
   * @param objName - The Object type to check.
   *
   * @see https://salesforce.stackexchange.com/questions/195449/what-is-the-longest-uri-that-salesforce-will-accept-through-the-rest-api/195450
   */
  protected async soqlSelectAllMayBeTooBig(objName: string): Promise<Boolean> {
    const description = await this.describeObject(objName);
    const mockql = encodeURIComponent(`select ${description.fields.map(f => f.name).join(', ')} from ${objName}`);
    return mockql.length > 15000;
  }

}
