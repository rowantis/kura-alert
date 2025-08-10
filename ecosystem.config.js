const common = {
  script: 'nest start',
  cwd: __dirname,
  instances: 1,
  autorestart: true,
  watch: false,
  max_memory_restart: '1G',
  baseEnv: {
    CHAIN_ID: 1329,
    NODE_RPC_URLS: 'https://sei-mainnet.g.alchemy.com/v2/vuqDPwdjcPsiI-Dfhd_Lu',
  },
  development: {
    NODE_ENV: 'development',
    WEBHOOK_ALERT_URL:
      'https://hooks.slack.com/services/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',
  },
  production: {
    NODE_ENV: 'production',
    WEBHOOK_ALERT_URL:
      'https://hooks.slack.com/services/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',
  }
};

const createAppConfig = (name) => ({
  name,
  ...common,
  env: {
    ...common.baseEnv,
    ...common.development,
  },
  env_production: {
    ...common.baseEnv,
    ...common.production,
  }
});

module.exports = {
  apps: [createAppConfig('kura-alert')]
}