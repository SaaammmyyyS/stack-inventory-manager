import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActiveInventoryTable from '../ActiveInventoryTable';

global.fetch = jest.fn();

describe('ActiveInventoryTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    const mockProps = {
      items: [],
      totalCount: 0,
      currentPage: 1,
      pageSize: 10,
      isAdmin: true,
      onPageChange: jest.fn(),
      onAdjust: jest.fn(),
      onHistory: jest.fn(),
      onDelete: jest.fn(),
      onEdit: jest.fn(),
    };

    render(<ActiveInventoryTable {...mockProps} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
