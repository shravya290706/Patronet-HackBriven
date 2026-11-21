import * as React from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export const ProcurementPage: React.FC = () => {
  return (
    <Container className="py-8">
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Bulk Procurement" }]}
        badge="Enterprise &amp; B2B"
        title="Bulk Hardware Procurement"
        description="Request verified supplier quotations, GST-compliant invoicing, and scheduled pan-India fleet deployment."
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form onSubmit={(e) => e.preventDefault()} className="lg:col-span-8 space-y-4 border border-outline-subtle p-6 rounded-sm bg-pure-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-label text-label-sm font-semibold mb-1">Company Name</label>
              <Input placeholder="Acme Technologies Pvt Ltd" />
            </div>
            <div>
              <label className="block font-label text-label-sm font-semibold mb-1">GSTIN Number</label>
              <Input placeholder="29AAAAA0000A1Z5" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-label text-label-sm font-semibold mb-1">Hardware Category</label>
              <Input placeholder="Developer Laptops (e.g. 32GB RAM)" />
            </div>
            <div>
              <label className="block font-label text-label-sm font-semibold mb-1">Quantity (Units)</label>
              <Input type="number" placeholder="25" />
            </div>
          </div>
          <div>
            <label className="block font-label text-label-sm font-semibold mb-1">Specific Requirements &amp; Timelines</label>
            <Textarea placeholder="Detail configuration requirements, operating system image needs, or targeted delivery milestones..." />
          </div>
          <div className="pt-2 flex items-center justify-between">
            <Link to="/procurement/PN-BULK-2026-4108/progress">
              <Button variant="primary">Submit RFQ Request</Button>
            </Link>
            <Link to="/procurement/PN-BULK-2026-4108/offers" className="text-sm text-primary-orange hover:underline font-semibold">
              View Active RFQ (Sample) &rarr;
            </Link>
          </div>
        </form>

        <div className="lg:col-span-4 p-6 border border-outline-subtle rounded-sm bg-light-gray space-y-3">
          <h4 className="font-headline text-title-md font-bold">Why procure through PATRONET?</h4>
          <ul className="space-y-2 font-body text-body-md text-muted-gray">
            <li>&bull; Verified OEM tier-1 authorized distributors.</li>
            <li>&bull; Automated multi-supplier price matching.</li>
            <li>&bull; Centralized warranty management across India.</li>
            <li>&bull; Input tax credit (ITC) compliant invoicing.</li>
          </ul>
        </div>
      </div>
    </Container>
  );
};
