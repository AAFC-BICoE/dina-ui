// components/CardGrid.tsx
import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { NavigationCard } from "../../types/common";
import { NavigationCardComponent } from "./NavigationCard";

interface CardGridProps {
  cards: NavigationCard[];
  itemsPerRow?: number;
}

export function CardGrid({ cards, itemsPerRow = 6 }: CardGridProps) {
  const getColSize = () => {
    switch(itemsPerRow) {
      case 3: return { xl: 4, lg: 4, md: 6, sm: 12 };
      case 4: return { xl: 3, lg: 4, md: 6, sm: 12 };
      case 5: return { xl: 2, lg: 3, md: 4, sm: 6 };
      case 6: return { xl: 2, lg: 2, md: 3, sm: 4, xs: 6 };
      default: return { xl: 2, lg: 2, md: 3, sm: 4, xs: 6 };
    }
  };

  const colProps = getColSize();

  return (
    <Row className="g-3">
      {cards.map((card) => (
        <Col key={card.id} {...colProps} className="mb-3">
          <div style={{
            width: '180px',
            maxWidth: '180px',
            margin: '0 auto'
          }}>
            <NavigationCardComponent card={card} />
          </div>
        </Col>
      ))}
    </Row>
  );
}