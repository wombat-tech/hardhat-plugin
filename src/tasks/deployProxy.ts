import { task, types } from 'hardhat/config'
import { StringArrayArgumentType } from '../lib/StringArrayArgumentType'
import { backoffRetry } from '../lib/retry'

type TaskParams = {
  proxyOwner: string
  /**
   * The name of the smart contract to proxy
   */
  name: string
  /**
   * The name of the proxy smart contract (should preferably be OpenZeppelin
   * TransparentUpgradeableProxy)
   */
  proxyName: string
  /**
   * The address to proxy to
   */
  address: string
  /**
   * The initializer function to call
   */
  initializerFunction: string
  /**
   * The initializer arguments for the proxied contract
   */
  arguments: string[]
  /**
   * Flag if the smart contract should be verified e.g. via etherscan after deployment
   */
  verify: boolean
}

task<TaskParams>(
  'deploy-proxy',
  'Deploy a proxy to a smart contract from a local file',
  async (taskArgs, env) => {
    const contract = await env.ethers.getContractFactory(taskArgs.name)
    if (env.hardhatArguments.verbose) {
      console.log('Deploying proxy to smart contract %s at %s with initializer function %s and arguments %s',
        taskArgs.name, taskArgs.address, taskArgs.initializerFunction, taskArgs.arguments)
    }
    // Encode the function data to the initializer function
    const initializerData = contract.interface.encodeFunctionData(
      taskArgs.initializerFunction, taskArgs.arguments
    )

    const Proxy = await env.ethers.getContractFactory(taskArgs.proxyName)
    const proxyArguments = [taskArgs.address, taskArgs.proxyOwner, initializerData] as const
    const proxy = await Proxy.deploy(...proxyArguments)
    await proxy.deployed()
    if (env.hardhatArguments.verbose) {
      console.log('Deployed proxy to address %s', proxy.address)
    }

    if (taskArgs.verify) {
      // See https://hardhat.org/plugins/nomiclabs-hardhat-etherscan#using-programmatically
      // This can take quite some time to work, as the tools to execute the verification don't see
      // the contract immediately. A retry with quite a bit of initial delay is used because of that
      // reason.
      await backoffRetry(
        () => {
          // Always log this, it's not considered verbose
          console.log('Verifying deployed smart contract (potentially a retry)')
          return env.run('verify:verify', {
            address: proxy.address,
            constructorArguments: proxyArguments
          })
        },
        5000,
        10,
        10_000 // It takes a _long_ time for block explorers to see the contract (on Goerli)
      )
      // TODO log out instructions on how to retry verification if it fails even after the retries
    }
    return proxy.address
  }).addParam(
  'proxyOwner',
  'Address owning the proxy and can change the implementation',
  undefined, types.string)
  .addParam(
    'name',
    'The name of the smart contract to proxy to (not the filename but the name of the contract itself)',
    undefined, types.string)
  .addParam(
    'proxyName',
    'The name of the proxy smart contract (defaults to TransparentUpgradeableProxy)',
    'TransparentUpgradeableProxy', types.string
  )
  .addParam(
    'address',
    'The address of the smart contract to proxy to',
    undefined, types.string
  )
  .addParam(
    'initializerFunction',
    'The name of the initializer function in the contract to proxy to',
    undefined, types.string
  )
  .addParam(
    'arguments',
    'The constructor argument values for the smart contract to be deployed, comma separated. If an argument is an array itself, provide the values semicolon separated.',
    [], StringArrayArgumentType, true)
  .addFlag('verify', 'Set to true if the smart contract should be verified after being deployed')
