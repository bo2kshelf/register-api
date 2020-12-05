import {registerAs} from '@nestjs/config';

export default registerAs('mongo', () => ({
  hosts: [
    {
      host: process.env.MONGO_HOST!,
      port: parseInt(process.env.MONGO_PORT!, 10),
    },
  ],
  database: process.env.MONGO_DATABASE!,
  username: process.env.MONGO_USERNAME!,
  password: process.env.MONGO_PASSWORD!,
}));
