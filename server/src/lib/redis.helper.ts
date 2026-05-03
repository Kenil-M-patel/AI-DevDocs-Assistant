import redisClient from './redis';

export default new (class RedisHelper {
  get(key: string) {
    return redisClient.GET(key);
  }

  set(key: string, data: string, EX?: number) {
    if (EX) {
      return redisClient.SET(key, data, { EX: EX });
    } else {
      return redisClient.SET(key, data);
    }
  }

  del(key: string) {
    return redisClient.DEL(key);
  }

  sIsMember(key: string, data: string) {
    return redisClient.sIsMember(key, data);
  }

  sAdd(key: string, data: string) {
    return redisClient.sAdd(key, data);
  }

  sRem(key: string, data: string) {
    return redisClient.sRem(key, data);
  }
})();
