import * as React from 'react';
import { ISalesFunnelSearchProps } from './ISalesFunnelSearchProps';
import { ISalesFunnelItem, ISearchState, SALES_FUNNEL_LISTS, SEARCH_FIELDS } from '../models/ISalesFunnelItem';
import { SalesFunnelSearchService } from '../services/SalesFunnelSearchService';
import styles from './SalesFunnelSearch.module.scss';

export default class SalesFunnelSearch extends React.Component<ISalesFunnelSearchProps, ISearchState> {
  private searchService: SalesFunnelSearchService;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ISalesFunnelSearchProps) {
    super(props);
    this.searchService = new SalesFunnelSearchService(props.context,props.siteUrl);
    this.state = {
      query: '',
      results: [],
      isLoading: false,
      hasSearched: false,
      errorMessage: undefined,
      activeList: 'all',
      searchField: 'all',
    };
  }

  // ─── Handlers ──────────────────────────────────────────────────────────────

  private handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const query = e.target.value;
    this.setState({ query });
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (query.trim().length >= 2) {
      this.debounceTimer = setTimeout(() => this.executeSearch(query), 500);
    } else {
      this.setState({ results: [], hasSearched: false });
    }
  };

  private handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.executeSearch(this.state.query);
    }
    if (e.key === 'Escape') this.clearSearch();
  };

  private clearSearch = (): void => {
    this.setState({ query: '', results: [], hasSearched: false, errorMessage: undefined });
  };

  private handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    this.setState({ searchField: e.target.value }, () => {
      if (this.state.query.trim().length >= 2) {
        this.executeSearch(this.state.query);
      }
    });
  };

  private handleListTabClick = (list: string): void => {
    this.setState({ activeList: list });
  };

  // ─── Search ─────────────────────────────────────────────────────────────────

  private async executeSearch(query: string): Promise<void> {
    if (!query || query.trim().length < 2) return;
    this.setState({ isLoading: true, errorMessage: undefined, hasSearched: true });
    try {
      const results = await this.searchService.searchAll(query.trim(), this.state.searchField);
      this.setState({ results, isLoading: false });
    } catch (error) {
      this.setState({
        isLoading: false,
        errorMessage: 'Search failed. Please check your permissions and try again.',
        results: [],
      });
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private getFilteredResults(): ISalesFunnelItem[] {
    const { results, activeList } = this.state;
    if (activeList === 'all') return results;
    return results.filter(r => r.sourceList === activeList);
  }

  private getCountForList(list: string): number {
    if (list === 'all') return this.state.results.length;
    return this.state.results.filter(r => r.sourceList === list).length;
  }

  private formatCurrency(value?: number): string {
    if (!value || value === 0) return '';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  private getStatusColor(status?: string): string {
    if (!status) return styles.statusDefault;
    const s = status.toLowerCase();
    if (s.includes('won') || s.includes('award')) return styles.statusWon;
    if (s.includes('lost') || s.includes('no award')) return styles.statusLost;
    if (s.includes('pending') || s.includes('active') || s.includes('bid')) return styles.statusPending;
    if (s.includes('cancel')) return styles.statusCancelled;
    return styles.statusDefault;
  }

  private getListBadgeColor(listName: string): string {
    const colors: Record<string, string> = {
      'Aggregate Sales Funnel': styles.badgeAggregate,
      '2026': styles.badge2026,
      '2025': styles.badge2025,
      '2024': styles.badge2024,
      '2023': styles.badge2023,
      '2022': styles.badge2022,
      '2021': styles.badge2021,
      '2020': styles.badge2020,
    };
    return colors[listName] || styles.badgeDefault;
  }

  // ─── Render Helpers ──────────────────────────────────────────────────────────

  private renderSearchBar(): JSX.Element {
    const { query, isLoading, searchField } = this.state;
    return (
      <div className={styles.searchBarWrapper}>
        <div className={styles.searchBar}>
          <div className={styles.searchIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            className={styles.searchInput}
            value={query}
            onChange={this.handleInputChange}
            onKeyDown={this.handleKeyDown}
            placeholder={this.props.placeholder || 'Search by project, owner, city, estimator...'}
            autoComplete="off"
            aria-label="Search sales funnel"
          />
          {query && (
            <button className={styles.clearBtn} onClick={this.clearSearch} aria-label="Clear">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <div className={styles.divider} />
          <select
            className={styles.fieldSelect}
            value={searchField}
            onChange={this.handleFieldChange}
            aria-label="Search field"
          >
            {SEARCH_FIELDS.map(f => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
          <button
            className={styles.searchBtn}
            onClick={() => this.executeSearch(this.state.query)}
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? <span className={styles.spinner} /> : 'Search'}
          </button>
        </div>
      </div>
    );
  }

  private renderListTabs(): JSX.Element {
    const { activeList } = this.state;
    const listsWithResults = SALES_FUNNEL_LISTS.filter(l => this.getCountForList(l) > 0);

    return (
      <div className={styles.tabsWrapper}>
        <button
          className={`${styles.tab} ${activeList === 'all' ? styles.tabActive : ''}`}
          onClick={() => this.handleListTabClick('all')}
        >
          All Results
          <span className={styles.tabCount}>{this.getCountForList('all')}</span>
        </button>
        {listsWithResults.map(list => (
          <button
            key={list}
            className={`${styles.tab} ${activeList === list ? styles.tabActive : ''}`}
            onClick={() => this.handleListTabClick(list)}
          >
            {list}
            <span className={styles.tabCount}>{this.getCountForList(list)}</span>
          </button>
        ))}
      </div>
    );
  }

  private renderResultCard(item: ISalesFunnelItem): JSX.Element {
    return (
      <a
        key={`${item.sourceList}-${item.Id}`}
        href={item.itemUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.card}
      >
        {/* Card Header */}
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleRow}>
            <span className={styles.cardTitle}>
              {item.Project || item.Title || '(No Title)'}
            </span>
            {item.Status && (
              <span className={`${styles.statusBadge} ${this.getStatusColor(item.Status)}`}>
                {item.Status}
              </span>
            )}
          </div>
          <div className={styles.cardSubRow}>
            <span className={`${styles.listBadge} ${this.getListBadgeColor(item.sourceList)}`}>
              {item.sourceList}
            </span>
            {item.Bid2WinID && (
              <span className={styles.bid2winId}>ID: {item.Bid2WinID}</span>
            )}
          </div>
        </div>

        {/* Card Body - Key Fields Grid */}
        <div className={styles.cardGrid}>
          {item.Owner && (
            <div className={styles.cardField}>
              <span className={styles.fieldLabel}>Owner</span>
              <span className={styles.fieldValue}>{item.Owner}</span>
            </div>
          )}
          {item.Estimator && (
            <div className={styles.cardField}>
              <span className={styles.fieldLabel}>Estimator</span>
              <span className={styles.fieldValue}>{item.Estimator}</span>
            </div>
          )}
          {item.BusinessArea && (
            <div className={styles.cardField}>
              <span className={styles.fieldLabel}>Business Area</span>
              <span className={styles.fieldValue}>{item.BusinessArea}</span>
            </div>
          )}
          {item.Segment && (
            <div className={styles.cardField}>
              <span className={styles.fieldLabel}>Segment</span>
              <span className={styles.fieldValue}>{item.Segment}</span>
            </div>
          )}
          {(item.City || item.State) && (
            <div className={styles.cardField}>
              <span className={styles.fieldLabel}>Location</span>
              <span className={styles.fieldValue}>
                {[item.City, item.County, item.State].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          {item.BidDate && (
            <div className={styles.cardField}>
              <span className={styles.fieldLabel}>Bid Date</span>
              <span className={styles.fieldValue}>{item.BidDate}</span>
            </div>
          )}
          {item.AwardDate && (
            <div className={styles.cardField}>
              <span className={styles.fieldLabel}>Award Date</span>
              <span className={styles.fieldValue}>{item.AwardDate}</span>
            </div>
          )}
          {item.PrimeOrSub && (
            <div className={styles.cardField}>
              <span className={styles.fieldLabel}>Prime/Sub</span>
              <span className={styles.fieldValue}>{item.PrimeOrSub}</span>
            </div>
          )}
          {item.Plant && (
            <div className={styles.cardField}>
              <span className={styles.fieldLabel}>Plant</span>
              <span className={styles.fieldValue}>{item.Plant}</span>
            </div>
          )}
          {item.LowBidderName && (
            <div className={styles.cardField}>
              <span className={styles.fieldLabel}>Low Bidder</span>
              <span className={styles.fieldValue}>{item.LowBidderName}</span>
            </div>
          )}
          {item.PISStatus && (
            <div className={styles.cardField}>
              <span className={styles.fieldLabel}>PIS Status</span>
              <span className={styles.fieldValue}>{item.PISStatus}</span>
            </div>
          )}
        </div>

        {/* Card Footer - Estimated Value */}
        {item.EstimatedValue && item.EstimatedValue > 0 ? (
          <div className={styles.cardFooter}>
            <span className={styles.valueLabel}>Estimated Value</span>
            <span className={styles.valueAmount}>{this.formatCurrency(item.EstimatedValue)}</span>
          </div>
        ) : null}

        <div className={styles.cardArrow}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </a>
    );
  }

  private renderResults(): JSX.Element {
    const { isLoading, hasSearched, errorMessage, query } = this.state;
    const filtered = this.getFilteredResults();

    if (isLoading) {
      return (
        <div className={styles.stateArea}>
          <div className={styles.loadingDots}><span /><span /><span /></div>
          <p>Searching across all Sales Funnel lists...</p>
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className={`${styles.stateArea} ${styles.errorState}`}>
          <div className={styles.stateIcon}>⚠️</div>
          <p>{errorMessage}</p>
        </div>
      );
    }

    if (!hasSearched) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className={styles.emptyTitle}>Search the Sales Funnel</p>
          <p className={styles.emptySubtitle}>
            Search across {SALES_FUNNEL_LISTS.length} lists — by project name, owner, city, estimator, status, and more
          </p>
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <p className={styles.emptyTitle}>No results for "{query}"</p>
          <p className={styles.emptySubtitle}>Try a different keyword or change the search field</p>
        </div>
      );
    }

    return (
      <div className={styles.resultsList}>
        <p className={styles.resultCount}>
          Showing <strong>{filtered.length}</strong> result{filtered.length !== 1 ? 's' : ''}
          {this.state.activeList !== 'all' ? ` in ${this.state.activeList}` : ' across all lists'}
        </p>
        {filtered.map(item => this.renderResultCard(item))}
      </div>
    );
  }

  // ─── Main Render ─────────────────────────────────────────────────────────────

  public render(): JSX.Element {
    const { hasSearched, results } = this.state;
    return (
      <div className={styles.container}>
        {this.props.title && <h2 className={styles.webPartTitle}>{this.props.title}</h2>}
        {this.renderSearchBar()}
        {hasSearched && results.length > 0 && this.renderListTabs()}
        {this.renderResults()}
      </div>
    );
  }
}
