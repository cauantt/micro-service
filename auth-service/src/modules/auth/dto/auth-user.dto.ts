export class OAuthUserDto {

  provider: 'google' | 'apple' | 'facebook' | 'github'; 
  providerId: string; 
  email?: string; 
  name?: string;
 
}