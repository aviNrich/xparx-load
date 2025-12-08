import React from 'react';
import { ChevronDown, Filter } from 'lucide-react';

interface Supplier {
  name: string;
  category: string;
  logo: string;
  successTransactions: string;
  deliveryFee: string;
  satisfactionRate: string;
  totalTransfer: string;
}

export function ItemSuppliers() {
  const suppliers: Supplier[] = [
    {
      name: 'Luis Vuitton',
      category: 'Fashion, Jewelry',
      logo: 'LV',
      successTransactions: '12.500 item',
      deliveryFee: '$450 /Truck',
      satisfactionRate: '97.12%',
      totalTransfer: '$1.450.27',
    },
    {
      name: 'Ikea Company',
      category: 'Furniture, Property',
      logo: 'IKEA',
      successTransactions: '16.400 item',
      deliveryFee: '$1000 /Truck',
      satisfactionRate: '92.37%',
      totalTransfer: '$320.89',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-neutral-900">Item Suppliers</h2>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors">
            Categories
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">

              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Succes Transaction
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Delivery Fee
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Satisfaction Rate
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Total Transfer
              </th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier, index) => (
              <tr
                key={index}
                className="border-b border-neutral-50 hover:bg-neutral-25 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-semibold ${
                      index === 0
                        ? 'bg-neutral-900 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {supplier.logo}
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900">{supplier.name}</div>
                      <div className="text-sm text-neutral-500">{supplier.category}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-medium text-neutral-900">{supplier.successTransactions}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-neutral-900">
                    <span className="font-semibold">{supplier.deliveryFee.split(' ')[0]}</span>
                    <span className="text-neutral-500 text-sm"> {supplier.deliveryFee.split(' ')[1]}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-medium text-neutral-900">{supplier.satisfactionRate}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-semibold text-neutral-900">{supplier.totalTransfer}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
