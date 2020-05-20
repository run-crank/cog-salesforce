import * as jsforce from 'jsforce';

export class ObjectAwareMixin {
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
   */
  public async findObjectById(objName: string, id: string): Promise<Record<string, any>> {
    return this.findObjectByField(objName, 'Id', id);
  }

  /**
   * Retrieves a single Object record based on a given field/value.
   *
   * @param objName - Salesforce object name.
   * @param field - Salesforce object field used to query for the object.
   * @param value - Value of the Salesforce object field to query by.
   */
  public async findObjectByField(objName: string, field: string, value: string): Promise<Record<string, any>> {
    return this.findObjectByFields(objName, { [field]: value });
  }

  public async findObjectByFields(objName: string, fieldMap: Record<string, any>): Promise<Record<string, any>> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.sobject(objName).findOne(fieldMap, (err, record) => {
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
}
