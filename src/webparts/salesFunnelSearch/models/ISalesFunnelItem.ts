export interface ISalesFunnelItem {
  Id: number;
  Title: string;
  Project?: string;
  Owner?: string;
  Estimator?: string;
  BusinessArea?: string;
  City?: string;
  County?: string;
  State?: string;
  Status?: string;
  BidDate?: string;
  AwardDate?: string;
  EstimatedValue?: number;
  Segment?: string;
  PrimeOrSub?: string;
  LowBidderName?: string;
  Bid2WinID?: string;
  Plant?: string;
  Place?: string;
  PISStatus?: string;
  sourceList: string;
  itemUrl: string;
}

export interface ISearchState {
  query: string;
  results: ISalesFunnelItem[];
  isLoading: boolean;
  hasSearched: boolean;
  errorMessage?: string;
  activeList: string;
  searchField: string;
}

export const SALES_FUNNEL_LISTS = [
  'Aggregate Sales Funnel',
  '2026',
  '2025',
  '2024',
  '2023',
  '2022',
  '2021',
  '2020',
];

export const SEARCH_FIELDS = [
  { key: 'all', label: 'All Fields' },
  { key: 'Title', label: 'Title' },
  { key: 'Project', label: 'Project' },
  { key: 'Owner', label: 'Owner' },
  { key: 'Estimator', label: 'Estimator' },
  { key: 'City', label: 'City' },
  { key: 'Status', label: 'Status' },
  { key: 'Bid2WinID', label: 'Bid2Win ID' },
  { key: 'BusinessArea', label: 'Business Area' },
  { key: 'Segment', label: 'Segment' },
];
