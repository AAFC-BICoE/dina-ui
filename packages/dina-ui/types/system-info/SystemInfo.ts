export type ModuleStatus = "online" | "offline";

export interface ApiConfigInfo {
  apiEndpoint: string;
  moduleName: string;
}

export interface ApiModule {
  moduleVersion: string;
  status: ModuleStatus;
  apiConfig: ApiConfigInfo;
  messageProducerEnabled?: boolean;
  messageConsumerEnabled?: boolean;
  attentionRequired?: boolean;
  moduleInfo?: Map<string, any>;
  errorMessage?: string;
  errorStatus?: string;
  errorStatusText?: string;
}

export interface SystemInfoData {
  modules: ApiModule[];
  pageLastRefreshed: Date;
}
