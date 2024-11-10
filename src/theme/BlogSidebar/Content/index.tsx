/**
 * Use post titles to infer blog post series
 */
import React, { memo, type ReactNode } from 'react';
import Heading, { HeadingType } from '@theme/Heading';
import type { Props } from '@theme/BlogSidebar/Content';
import { BlogSidebarItem } from '@docusaurus/plugin-content-blog';


function BlogSidebarGroup({ title, headingType, children }: { title: string, headingType: HeadingType, children: ReactNode }) {
  return (
    <div role="group">
      <Heading as={headingType}>
        {title}
      </Heading>
      {children}
    </div>
  );
}

function groupBySeries(items: BlogSidebarItem[], ListComponent: Props["ListComponent"]) {
  var returnItems = [];
  var seriesItems: BlogSidebarItem[] = [];

  function flushSeries() {
    if (seriesItems.length === 0) {
      return;
    }

    const seriesTitle = seriesItems[0].title.split(":")[0];

    // Strip the series name from the titles
    seriesItems = seriesItems.map(item => {
      return {
        ...item,
        title: item.title.split(":")[1].trim(),
      }
    });

    // Reverse the display ordering - normally blog items are shown in descending time order,
    // but for a series, we want to show ascending order
    seriesItems = seriesItems.reverse();

    returnItems.push(<>
      <BlogSidebarGroup title={seriesTitle} headingType='h4'>
        <ul>
          <ListComponent items={seriesItems} />
        </ul>
      </BlogSidebarGroup>
    </>);

    seriesItems = [];
  }

  for (const item of items) {
    // If this item is part of a series, begin accumulating
    if (item.title.includes(":")) {
      seriesItems.push(item);
      continue;
    }

    flushSeries();

    returnItems.push(<ListComponent items={[item]} />);
  }

  flushSeries();
  return returnItems;
}

function groupByYear(items: BlogSidebarItem[], ListComponent: Props["ListComponent"]) {
  var returnItems = [];
  var yearItems: BlogSidebarItem[] = [];

  function flushSeries() {
    if (yearItems.length === 0) {
      return;
    }

    const yearTitle = new Date(yearItems[0].date).getFullYear();
    const yearItemsGrouped = groupBySeries(yearItems, ListComponent);

    returnItems.push(<>
      <BlogSidebarGroup title={String(yearTitle)} headingType='h3'>
        {yearItemsGrouped}
      </BlogSidebarGroup>
    </>);

    yearItems = [];
  }

  for (const item of items) {
    if (yearItems.length === 0) {
      yearItems.push(item);
      continue;
    }

    const itemYear = new Date(item.date).getFullYear();
    const currentYear = new Date(yearItems[0].date).getFullYear();

    if (itemYear !== currentYear) {
      flushSeries();
    }

    yearItems.push(item);
  }

  flushSeries();
  return returnItems;
}

function BlogSidebarContent({
  items,
  yearGroupHeadingClassName,
  ListComponent,
}: Props): ReactNode {
  return groupByYear(items, ListComponent);
}

export default memo(BlogSidebarContent);
