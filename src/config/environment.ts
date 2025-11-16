import Constants from 'expo-constants';

// Environment types
interface EnvironmentConfig {
  DEBUG_MODE: boolean;
  USE_LOCAL_DATABASE: boolean;
  CACHE_DURATION: number;
}

interface Config extends EnvironmentConfig {
  ENVIRONMENT: string;
}

// Environment configuration
const ENV: Record<string, EnvironmentConfig> = {
  development: {
    DEBUG_MODE: true,
    USE_LOCAL_DATABASE: true,
    CACHE_DURATION: 300000, // 5 minutes
  },
  production: {
    DEBUG_MODE: false,
    USE_LOCAL_DATABASE: true,
    CACHE_DURATION: 600000, // 10 minutes
  },
};

// Get current environment
const getEnvironment = (): string => {
  if (__DEV__) {
    return 'development';
  }
  return 'production';
};

// Export configuration for current environment
const currentEnv = getEnvironment();
export const config: Config = {
  ...ENV[currentEnv],
  ENVIRONMENT: currentEnv,
  // Override with expo config if available
  ...(Constants.expoConfig?.extra as Partial<EnvironmentConfig>),
};

// Helper function to log environment info
export const logEnvironmentInfo = (): void => {
  if (config.DEBUG_MODE) {
    console.log('🔧 Environment Configuration:');
    console.log({
      environment: config.ENVIRONMENT,
      debugMode: config.DEBUG_MODE,
      useLocalDatabase: config.USE_LOCAL_DATABASE,
      cacheDuration: config.CACHE_DURATION,
    });
  }
};

export default config;