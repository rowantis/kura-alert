import { PoolFinder } from '../src/utils/kura-alert/pool-finder';
import * as dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RPC_URL || 'https://sei.drpc.org';

async function main() {
  try {
    const args = process.argv.slice(2);
    const tvlFilter = args.length > 0 ? parseFloat(args[0]) : 0;
    const finder = new PoolFinder(RPC_URL);
    console.log(`TVL filter: $${tvlFilter}`);
    const kuraPools = await finder.generateAllKuraPools(tvlFilter);
    await finder.savePoolsToFile(kuraPools);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().then(() => {
    console.log('\n🏁 Script completed');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
}
