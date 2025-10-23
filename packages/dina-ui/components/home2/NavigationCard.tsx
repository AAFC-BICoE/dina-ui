// components/NavigationCard.tsx
import Link from "next/link";
import React from "react";
import Card from "react-bootstrap/Card";
import { NavigationCard } from "../../types/common/home2/HomePageTypes";
import { DinaMessage } from "../../intl/dina-ui-intl";

interface NavigationCardProps {
  card: NavigationCard;
}

export function NavigationCardComponent({ card }: NavigationCardProps) {
  const IconComponent = card.icon;

  return (
    <Link href={card.href} passHref legacyBehavior>
      <Card 
        className="h-100 shadow-sm navigation-card" 
        style={{ 
          cursor: 'pointer', 
          transition: 'transform 0.2s',
          minHeight: '120px',
          maxHeight: '140px'
        }}        
        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <Card.Body className="d-flex flex-column align-items-center text-center p-4">
          <div className="mb-3">
            <IconComponent size={48} color="#0056b3" />
          </div>
          <Card.Title className="h6 mb-2">
            <DinaMessage id={card.title as any} />
          </Card.Title>
          {card.description && (
            <Card.Text className="text-muted small">
              <DinaMessage id={card.description as any} />
            </Card.Text>
          )}
        </Card.Body>
      </Card>
    </Link>
  );
}