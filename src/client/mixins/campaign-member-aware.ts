import { ObjectAwareMixin } from './object-aware';

export class CampaignMemberAwareMixin extends ObjectAwareMixin {

  /**
   * Retrieves a single CampaignMember record for a given email address.
   *
   * @param {String} email - Email address of the CampaignMember record to retrieve.
   */
  public async findCampaignMemberByEmailAndCampaignId(email: string, campaignId: string): Promise<Record<string, any>> {
    return this.findObjectByFields('CampaignMember', {
      Email: email,
      CampaignId: campaignId,
    });
  }
}
