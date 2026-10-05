import { fetchAPI } from "@/features/api/fetchApi";
import type { ApiConfig, Call, User } from "@/features/drivers/types";

export type UserFilters = {
  q?: string;
};

export interface HubApi {
  getConfig(): Promise<ApiConfig>;
  getUsers(filters?: UserFilters): Promise<User[]>;
  updateUser(payload: Partial<User> & { id: string }): Promise<User>;
  /**
   * Starts a call in a conversation. `created` is false when the conversation
   * already had an ongoing call, which is then the one to join.
   */
  startCall(chatId: string): Promise<{ call: Call; created: boolean }>;
  getCall(id: string): Promise<Call>;
}

export class StandardHubApi implements HubApi {
  async getConfig(): Promise<ApiConfig> {
    const response = await fetchAPI(`config/`);
    return response.json();
  }

  async getUsers(filters?: UserFilters): Promise<User[]> {
    const response = await fetchAPI(`users/`, {
      params: filters,
    });
    return response.json();
  }

  async updateUser(payload: Partial<User> & { id: string }): Promise<User> {
    const response = await fetchAPI(`users/${payload.id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return response.json();
  }

  async startCall(chatId: string): Promise<{ call: Call; created: boolean }> {
    const response = await fetchAPI(`calls/`, {
      method: "POST",
      body: JSON.stringify({ chat_service_id: chatId }),
    });
    return { call: await response.json(), created: response.status === 201 };
  }

  async getCall(id: string): Promise<Call> {
    const response = await fetchAPI(`calls/${id}/`);
    return response.json();
  }
}

let hubApi: HubApi = new StandardHubApi();

export const getHubApi = (): HubApi => hubApi;

export const setHubApiForTests = (api: HubApi): void => {
  hubApi = api;
};

export const resetHubApiForTests = (): void => {
  hubApi = new StandardHubApi();
};
