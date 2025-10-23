// components/NavigationCard.tsx
import Link from "next/link";
import React, { useState } from "react";
import Card from "react-bootstrap/Card";
import { NavigationCard } from "../../types/common/home2/HomePageTypes";
import { DinaMessage } from "../../intl/dina-ui-intl";

interface NavigationCardProps {
  card: NavigationCard;
}

export function NavigationCardComponent({ card }: NavigationCardProps) {
  const IconComponent = card.icon;
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Link href={card.href} passHref legacyBehavior>
      <Card 
        className="h-100 shadow-sm navigation-card" 
        style={{ 
          cursor: 'pointer',
          minHeight: '140px',
          maxHeight: '160px',
          width: '100%',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          backgroundColor: isPressed ? '#e3f2fd' : '#ffffff', 
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isPressed ? 'scale(0.96)' : 'scale(1)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', 
        }}
        onMouseEnter={(e) => {
          // hover effects
          e.currentTarget.style.backgroundColor = '#d2d6e0ff'; 
          e.currentTarget.style.borderColor = '#1976d2';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(25, 118, 210, 0.25), 0 8px 24px rgba(0, 0, 0, 0.15)';  // Deep blue-tinted shadow
          e.currentTarget.style.transform = 'translateY(-8px) scale(1.03)';  // More elevation and scale
          
          // Change icon color on hover
          const icon = e.currentTarget.querySelector('svg');
          if (icon) {
            icon.style.color = '#062f5eff';  // Darker blue on hover
          }
        }}
        onMouseLeave={(e) => {
          if (!isPressed) {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#e0e0e0';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            
            // Reset icon color
            const icon = e.currentTarget.querySelector('svg');
            if (icon) {
              icon.style.color = '#1976d2';
            }
          }
        }}
        onMouseDown={(e) => {
          setIsPressed(true);
          e.currentTarget.style.backgroundColor = '#e3f2fd';
          e.currentTarget.style.borderColor = '#1565c0';
          e.currentTarget.style.transform = 'translateY(-4px) scale(0.98)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(25, 118, 210, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)';
          
          // Darker icon on press
          const icon = e.currentTarget.querySelector('svg');
          if (icon) {
            icon.style.color = '#0d47a1';
          }
        }}
        onMouseUp={(e) => {
          setIsPressed(false);
          // Return to hover state
          e.currentTarget.style.backgroundColor = '#f3f7ff';
          e.currentTarget.style.borderColor = '#1976d2';
          e.currentTarget.style.transform = 'translateY(-8px) scale(1.03)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(25, 118, 210, 0.25), 0 8px 24px rgba(0, 0, 0, 0.15)';
          
          const icon = e.currentTarget.querySelector('svg');
          if (icon) {
            icon.style.color = '#1565c0';
          }
        }}
      >
        <Card.Body 
          className="d-flex flex-column align-items-center text-center"
          style={{ 
            padding: '10px 8px',
            minHeight: '140px',
            justifyContent: 'center'
          }}
        >
          <div className="mb-2">
            <IconComponent 
              size={32}
              style={{
                color: '#1976d2',
                transition: 'color 0.3s ease' 
              }}
            />
          </div>
          <Card.Title 
            className="h6 mb-0"
            style={{
              fontSize: '0.8rem',
              fontWeight: 500,
              lineHeight: '1.2',
              color: '#1a1a1a',
              textAlign: 'center',
              transition: 'color 0.3s ease' 
            }}
          >
            <DinaMessage id={card.title as any} />
          </Card.Title>
          {card.description && (
            <Card.Text 
              className="text-muted small mt-1"
              style={{
                fontSize: '0.7rem',
                lineHeight: '1.1',
                transition: 'color 0.3s ease'
              }}
            >
              <DinaMessage id={card.description as any} />
            </Card.Text>
          )}
        </Card.Body>
      </Card>
    </Link>
  );
}