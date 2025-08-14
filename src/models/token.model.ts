export interface TokenModel {
  access_token: string;
  refresh_token: string;
}

export interface TokenPayload {
  id: number;
  name: string;
  email: string;
}

export default TokenModel;
