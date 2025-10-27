import Link from "next/link";
import React, { useState } from "react";
import Card from "react-bootstrap/Card";
import { NavigationCard } from "../../types/common/home2/HomePageTypes";
import { DinaMessage } from "../../intl/dina-ui-intl";
import styles from "./NavigationCard.module.css";

interface NavigationCardProps {
  card: NavigationCard;
}

export function NavigationCardComponent({ card }: NavigationCardProps) {
  const IconComponent = card.icon;
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const cardClass = [
    styles.navigationCard,
    isHovered ? styles.isHovered : "",
    isPressed ? styles.isPressed : ""
  ].join(" ");

  return (
    <Link href={card.href} passHref legacyBehavior>
      <Card
        className={cardClass}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
      >
        <Card.Body
          className="d-flex flex-column align-items-center text-center"
          style={{
            padding: "10px 8px",
            minHeight: "140px",
            justifyContent: "center",
          }}
        >
          <div className="mb-2">
            <IconComponent
              size={32}
              style={{
                color: isPressed
                  ? "#0d47a1"
                  : isHovered
                  ? "#062f5eff"
                  : "#1976d2",
                transition: "color 0.3s ease",
              }}
            />
          </div>
          <Card.Title
            className="h6 mb-0"
            style={{
              fontSize: "0.8rem",
              fontWeight: 500,
              lineHeight: "1.2",
              color: "#1a1a1a",
              textAlign: "center",
              transition: "color 0.3s ease",
            }}
          >
            <DinaMessage id={card.title as any} />
          </Card.Title>
          {card.description && (
            <Card.Text
              className="text-muted small mt-1"
              style={{
                fontSize: "0.7rem",
                lineHeight: "1.1",
                transition: "color 0.3s ease",
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