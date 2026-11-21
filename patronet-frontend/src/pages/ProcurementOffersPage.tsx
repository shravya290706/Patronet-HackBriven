import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";

export const ProcurementOffersPage: React.FC = () => {
  const { id = "PN-BULK-2026-4108" } = useParams<{ id: string }>();

  return (
    <Container className="py-8">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Procurement", href: "/procurement" },
          { label: id },
          { label: "Offers" },
        ]}
        badge="Supplier Quotations"
        title="Compare Supplier Offers"
        description="Review incoming competitive bids for your enterprise bulk hardware request."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-outline-subtle p-6 rounded-sm bg-pure-white flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="font-label text-label-sm font-semibold uppercase text-accent-orange-text">
                Recommended Tier 1
              </span>
              <span className="font-label text-label-sm font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-sm">
                98% Match
              </span>
            </div>
            <h3 className="font-headline text-title-lg font-bold mt-2">National Infotech Logistics</h3>
            <div className="text-2xl font-bold font-headline tabular-nums mt-2">
              ₹1,68,500 <span className="text-sm font-normal text-muted-gray">/ unit</span>
            </div>
            <ul className="mt-4 space-y-1 font-body text-body-md text-muted-gray">
              <li>&bull; Delivery in 4 business days</li>
              <li>&bull; GST ITC verified invoice included</li>
              <li>&bull; 3-year onsite enterprise warranty</li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-outline-subtle">
            <Button variant="primary" className="w-full">Select Offer</Button>
          </div>
        </div>

        <div className="border border-outline-subtle p-6 rounded-sm bg-pure-white flex flex-col justify-between">
          <div>
            <span className="font-label text-label-sm font-semibold uppercase text-muted-gray">
              Direct OEM Distributor
            </span>
            <h3 className="font-headline text-title-lg font-bold mt-2">Apex Hardware Systems</h3>
            <div className="text-2xl font-bold font-headline tabular-nums mt-2">
              ₹1,72,000 <span className="text-sm font-normal text-muted-gray">/ unit</span>
            </div>
            <ul className="mt-4 space-y-1 font-body text-body-md text-muted-gray">
              <li>&bull; Delivery in 2 business days (Immediate dispatch)</li>
              <li>&bull; GST ITC verified invoice included</li>
              <li>&bull; 3-year standard warranty</li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-outline-subtle">
            <Button variant="outline" className="w-full">Select Offer</Button>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <Link to={`/procurement/${id}/progress`}>
          <Button variant="ghost" size="sm">&larr; Back to Negotiation Progress</Button>
        </Link>
      </div>
    </Container>
  );
};
