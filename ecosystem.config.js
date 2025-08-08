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