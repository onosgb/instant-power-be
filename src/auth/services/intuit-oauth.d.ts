type TokenModel = {
  realmId: string;
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
  id_token: string;
  state: string;
};

type AuthResponse = {
  token: TokenModel;
  response: Response;
  body: object;
  json: object;
  intuit_tid: string;
};

export interface IntuitOAuth {
  scopes: string[];
  authorizeUri(params: { scope: string[]; state: string }): Promise<string>;
  createToken(url: string): Promise<AuthResponse>;
  refreshUsingToken(refresh_token: string): Promise<AuthResponse>;
}
