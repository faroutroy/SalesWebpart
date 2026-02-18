import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import SalesFunnelSearch from './components/SalesFunnelSearch';
import { ISalesFunnelSearchProps } from './components/ISalesFunnelSearchProps';

export interface ISalesFunnelSearchWebPartProps {
  title: string;
  placeholder: string;
}

export default class SalesFunnelSearchWebPart extends BaseClientSideWebPart<ISalesFunnelSearchWebPartProps> {

  public render(): void {
    const element: React.ReactElement<ISalesFunnelSearchProps> = React.createElement(
      SalesFunnelSearch,
      {
        context: this.context,
        title: this.properties.title || 'Sales Funnel Search',
        placeholder: this.properties.placeholder || 'Search by project, owner, city, estimator...',
      }
    );
    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'Configure Sales Funnel Search' },
          groups: [
            {
              groupName: 'Settings',
              groupFields: [
                PropertyPaneTextField('title', {
                  label: 'Web Part Title',
                  placeholder: 'Sales Funnel Search',
                }),
                PropertyPaneTextField('placeholder', {
                  label: 'Search Input Placeholder',
                  placeholder: 'Search by project, owner, city...',
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
