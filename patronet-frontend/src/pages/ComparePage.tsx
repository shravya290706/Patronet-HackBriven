import * as React from "react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { MOCK_PRODUCTS } from "@/mocks/products";

export const ComparePage: React.FC = () => {
  return (
    <Container className="py-8">
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "AI Comparison Studio" }]}
        badge="Side-by-Side Analysis"
        title="AI Comparison Studio"
        description="Compare specifications, thermal performance ratings, and value scores across selected hardware."
      />
      <div className="overflow-x-auto border border-outline-subtle rounded-sm bg-pure-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-subtle bg-light-gray">
              <th className="p-4 font-label text-label-md font-semibold text-muted-gray w-1/4">Specification</th>
              {MOCK_PRODUCTS.slice(0, 2).map((p) => (
                <th key={p.id} className="p-4 font-label text-label-md font-semibold text-on-pure-white w-3/8">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-subtle font-body text-body-md">
            <tr>
              <td className="p-4 font-medium text-muted-gray">Price</td>
              {MOCK_PRODUCTS.slice(0, 2).map((p) => (
                <td key={p.id} className="p-4 font-bold tabular-nums">
                  ₹{p.price.toLocaleString("en-IN")}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-muted-gray">Category</td>
              {MOCK_PRODUCTS.slice(0, 2).map((p) => (
                <td key={p.id} className="p-4">{p.brand} Flagship</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Container>
  );
};
