import * as React from "react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Sparkles, Send } from "lucide-react";

export const AIShoppingPage: React.FC = () => {
  return (
    <Container className="py-8">
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "AI Shopping Assistant" }]}
        badge="Conversational Intelligence"
        title="AI Shopping Assistant"
        description="Describe your computational workload, design requirements, or gaming preferences for tailored hardware matches."
      />
      <div className="max-w-3xl mx-auto border border-outline-subtle rounded-sm bg-pure-white p-6 shadow-sm">
        <div className="flex items-center gap-3 p-4 bg-light-gray rounded-sm mb-6">
          <Sparkles className="w-5 h-5 text-primary-orange shrink-0" />
          <p className="font-body text-body-md text-on-pure-white">
            "Tell us what you need. (e.g., 'Looking for a 32GB laptop for Unreal Engine 5 and 4K video rendering under ₹2,00,000')."
          </p>
        </div>

        <div className="flex gap-2">
          <Input placeholder="Describe your workload or requirements..." />
          <Button variant="primary">
            <Send className="w-4 h-4 mr-1.5" />
            Send
          </Button>
        </div>
      </div>
    </Container>
  );
};
