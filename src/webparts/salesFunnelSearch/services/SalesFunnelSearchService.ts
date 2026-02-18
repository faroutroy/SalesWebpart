import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { ISalesFunnelItem, SALES_FUNNEL_LISTS } from '../models/ISalesFunnelItem';

export class SalesFunnelSearchService {
  private context: WebPartContext;
  private siteUrl: string;

  constructor(context: WebPartContext) {
    this.context = context;
    this.siteUrl = context.pageContext.web.absoluteUrl;
  }

  /**
   * Build OData $filter string based on query and selected field
   */
  private buildFilter(query: string, field: string): string {
    const escaped = query.replace(/'/g, "''");

    if (field === 'all') {
      return [
        `substringof('${escaped}', Title)`,
        `substringof('${escaped}', Project)`,
        `substringof('${escaped}', Owner)`,
        `substringof('${escaped}', Estimator)`,
        `substringof('${escaped}', City)`,
        `substringof('${escaped}', Status)`,
        `substringof('${escaped}', Bid2WinID)`,
        `substringof('${escaped}', BusinessArea)`,
        `substringof('${escaped}', Segment)`,
        `substringof('${escaped}', LowBidderName)`,
      ].join(' or ');
    }

    return `substringof('${escaped}', ${field})`;
  }

  /**
   * Query a single SharePoint list with the search filter
   */
  private async queryList(listName: string, query: string, field: string): Promise<ISalesFunnelItem[]> {
    const filter = this.buildFilter(query, field);
    const select = [
      'Id', 'Title', 'Project', 'Owner', 'Estimator',
      'BusinessArea', 'City', 'County', 'State', 'Status',
      'BidDate', 'AwardDate', 'EstimatedValue', 'Segment',
      'PrimeOrSub', 'LowBidderName', 'Bid2WinID', 'Plant',
      'Place', 'PISStatus'
    ].join(',');

    const encodedList = encodeURIComponent(listName);
    const url = `${this.siteUrl}/_api/web/lists/getbytitle('${encodedList}')/items` +
      `?$select=${select}` +
      `&$filter=${encodeURIComponent(filter)}` +
      `&$top=50` +
      `&$orderby=Modified desc`;

    try {
      const response: SPHttpClientResponse = await this.context.spHttpClient.get(
        url,
        SPHttpClient.configurations.v1,
        {
          headers: {
            Accept: 'application/json;odata=nometadata',
            'odata-version': '',
          },
        }
      );

      if (!response.ok) {
        // List might not exist — silently skip
        console.warn(`List "${listName}" returned ${response.status}`);
        return [];
      }

      const json = await response.json();
      const items = json?.value || [];

      return items.map((item: any): ISalesFunnelItem => ({
        Id: item.Id,
        Title: item.Title || item.Project || '(No Title)',
        Project: item.Project || '',
        Owner: item.Owner || '',
        Estimator: item.Estimator || '',
        BusinessArea: item.BusinessArea || '',
        City: item.City || '',
        County: item.County || '',
        State: item.State || '',
        Status: item.Status || '',
        BidDate: item.BidDate ? new Date(item.BidDate).toLocaleDateString() : '',
        AwardDate: item.AwardDate ? new Date(item.AwardDate).toLocaleDateString() : '',
        EstimatedValue: item.EstimatedValue || 0,
        Segment: item.Segment || '',
        PrimeOrSub: item.PrimeOrSub || '',
        LowBidderName: item.LowBidderName || '',
        Bid2WinID: item.Bid2WinID || '',
        Plant: item.Plant || '',
        Place: item.Place || '',
        PISStatus: item.PISStatus || '',
        sourceList: listName,
        itemUrl: `${this.siteUrl}/Lists/${encodeURIComponent(listName)}/DispForm.aspx?ID=${item.Id}`,
      }));

    } catch (error) {
      console.warn(`Error querying list "${listName}":`, error);
      return [];
    }
  }

  /**
   * Search across ALL lists in parallel
   */
  public async searchAll(query: string, field: string): Promise<ISalesFunnelItem[]> {
    if (!query || query.trim().length < 2) return [];

    const promises = SALES_FUNNEL_LISTS.map(list =>
      this.queryList(list, query.trim(), field)
    );

    const results = await Promise.all(promises);

    // Flatten all results and sort by list name then title
    return ([] as ISalesFunnelItem[]).concat(...results);
  }

  /**
   * Search a specific list only
   */
  public async searchList(listName: string, query: string, field: string): Promise<ISalesFunnelItem[]> {
    if (!query || query.trim().length < 2) return [];
    return this.queryList(listName, query.trim(), field);
  }
}
