import * as React from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export const NotFoundPage: React.FC = () => {
  return (
    <Container className="py-24 text-center">
      <div className="max-w-md mx-auto">
        <span className="font-mono text-sm uppercase tracking-widest text-primary-orange font-bold">
          404 ERROR
        </span>
        <h1 className="font-headline text-4xl font-bold mt-2 mb-4 text-on-pure-white">
          Page Not Found
        </h1>
        <p className="font-body text-body-md text-muted-gray mb-8">
          The requested system route does not exist or has been relocated within the catalogue.
        </p>
        <Link to="/">
          <Button variant="primary">Return Home</Button>
        </Link>
      </div>
    </Container>
  );
};
