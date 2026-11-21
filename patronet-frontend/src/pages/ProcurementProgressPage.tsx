import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";

export const ProcurementProgressPage: React.FC = () => {
  const { id = "PN-BULK-2026-4108" } = useParams<{ id: string }>();

  return (
    <Container className="py-8">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Procurement", href: "/procurement" },
          { label: id },
          { label: "Progress" },
        ]}
        badge="Autonomous Sourcing"
        title={`Procurement Progress: ${id}`}
        description="Tracking automated supplier negotiation, volume tier pricing, and fulfillment availability."
      />
      <div className="p-6 border border-outline-subtle rounded-sm bg-pure-white space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-outline-subtle">
          <div>
            <h3 className="font-headline text-title-md font-semibold">Status: Sourcing 4 Verified Distributors</h3>
            <p className="font-body text-body-md text-muted-gray mt-1">Target: 25 Units &middot; Core i9 / RTX 4080 Laptops</p>
          </div>
          <Link to={`/procurement/${id}/offers`}>
            <Button variant="primary">Review Supplier Offers &rarr;</Button>
          </Link>
        </div>
        <p className="font-body text-body-md text-muted-gray">
          Real-time negotiation streaming and AI quote convergence will be wired to FastAPI event streams in Phase 2.2.
        </p>
      </div>
    </Container>
  );
};
