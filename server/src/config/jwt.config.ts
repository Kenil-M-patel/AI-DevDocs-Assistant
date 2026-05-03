import { SignOptions } from 'jsonwebtoken';
import config from './config';

export default {
  secret: config.JWT_SECRET,
  signOptions: {
    expiresIn: 604800, // 7 days in seconds
  } as SignOptions,
};
