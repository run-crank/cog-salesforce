import { ObjectAwareMixin } from './object-aware';

export class CampaignMemberAwareMixin extends ObjectAwareMixin {

  /**
   * Retrieves a single CampaignMember record for a given email address.
   *
   * @param {String} email - Email address of the CampaignMember record to retrieve.
   * @param {String[]} alwaysRetrieve - An optional list of fields that should
   *   always be retrieved when finding campaign members.
   */
  public async findCampaignMemberByEmailAndCampaignId(email: string, campaignId: string, alwaysRetrieve: string[] = []): Promise<Record<string, any>> {
    return this.findObjectByFields('CampaignMember', { Email: email, CampaignId: campaignId }, alwaysRetrieve);
  }
}
