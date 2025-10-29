// types/common/home2/HomePageTypes.ts
import { IconType } from 'react-icons';

export interface NavigationCard {
  id: string;
  title: string;
  icon: IconType; // Changed from string to IconType
  href: string | { pathname: string; query: Record<string, any> };
  description?: string;
  category: string;
}

export interface CardSection {
  title: string;
  cards: NavigationCard[];
}