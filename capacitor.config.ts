import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sathsara.ecbtracker',
  appName: 'ECB Tracker',
  webDir: 'build',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: true,
    backgroundColor: '#07090f',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#07090f',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
