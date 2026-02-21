import React from 'react';
import { LucideIcon } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbItemUI,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbItemType {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  breadcrumbs?: BreadcrumbItemType[];
  actions?: React.ReactNode;
}

const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  breadcrumbs,
  actions,
}: PageHeaderProps) => {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-3 sm:px-4 lg:px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            {breadcrumbs?.length ? (
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((item, idx) => {
                    const isLast = idx === breadcrumbs.length - 1;
                    return (
                      <React.Fragment key={`${item.label}-${idx}`}>
                        <BreadcrumbItemUI>
                          {isLast || !item.href ? (
                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                          )}
                        </BreadcrumbItemUI>
                        {!isLast ? <BreadcrumbSeparator /> : null}
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            ) : null}

            <div className="flex items-start gap-3">
              {Icon ? (
                <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              ) : null}

              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight truncate">
                  {title}
                </h1>
                {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
              </div>
            </div>
          </div>

          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;