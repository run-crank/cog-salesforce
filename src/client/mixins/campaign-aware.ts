import { ObjectAwareMixin } from './object-aware';

export class CampaignAwareMixin extends ObjectAwareMixin {

  /**
   * Retrieves a single Campaign record for a given ID
   *
   * @param {String} id - ID of the Campaign record to retrieve.
   * @param {String[]} alwaysRetrieve - An optional list of fields that should
   *   always be retrieved when finding campaigns.
   */
  public async findCampaignById(campaignId: string, alwaysRetrieve: string[] = []): Promise<Record<string, any>> {
    return this.findObjectByFields('Campaign', { Id: campaignId }, alwaysRetrieve);
  }
}
