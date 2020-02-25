import * as jsforce from 'jsforce';

export class CampaignMemberAwareMixin {
  clientReady: Promise<boolean>;
  client: jsforce.Connection;

  /**
   * Retrieves a single CampaignMember record for a given email address.
   *
   * @param {String} email - Email address of the CampaignMember record to retrieve.
   */
  public async findCampaignMemberByEmailAndCampaignId(email: string, campaignId: string): Promise<Record<string, any>> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      try {
        this.client.sobject('CampaignMember').findOne({ Email: email, CampaignId: campaignId }, (err, record) => {
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
}
