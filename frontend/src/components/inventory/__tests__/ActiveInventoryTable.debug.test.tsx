import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActiveInventoryTable from '../ActiveInventoryTable';

describe('ActiveInventoryTable Debug', () => {
  it('should show what actually renders', () => {
    const mockProps = {
      items: [{
        id: '1',
        name: 'Test Product 1',
        sku: 'TEST-001',
        quantity: 100,
        price: 99.99,
        tenantId: 'test-tenant',
      }],
      totalCount: 1,
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

    console.log(screen.getByRole('table').outerHTML);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
  });
});
