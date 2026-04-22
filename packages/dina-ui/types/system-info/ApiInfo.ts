import { KitsuResource } from "kitsu";

export interface ApiInfoAttributes {
  messageProducer?: boolean;
  messageConsumer?: boolean;
  attentionRequired?: boolean;
  moduleInfo?: Record<string, any>;
}

export type ApiInfo = KitsuResource & ApiInfoAttributes;
