import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PortalTabs } from './PortalTabs';

describe('PortalTabs', () => {
  it('marks the current tab and matches the index tab exactly', () => {
    render(
      <MemoryRouter initialEntries={['/medlemsportal/innstillinger']}>
        <PortalTabs
          label="Min side"
          tabs={[
            { to: '/medlemsportal', label: 'Oversikt', end: true },
            { to: '/medlemsportal/innstillinger', label: 'Innstillinger' },
          ]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('navigation', { name: 'Min side' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Innstillinger' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Oversikt' })).not.toHaveAttribute('aria-current');
  });
});
