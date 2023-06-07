import { task, types } from 'hardhat/config'
import { StringArrayArgumentType } from '../lib/StringArrayArgumentType'
import type { BigNumber } from 'ethers'
import { backoffRetry } from '../lib/retry'

type TaskParams = {
  /**
   * The name of the smart contract to deploy
   */
  name: string
  /**
   * The constructor arguments for the smart contract
   */
  arguments: string[]
  /**
   * Flag if the smart contract should be verified e.g. via etherscan after deployment
   */
  verify: boolean
}

/**
 * Converts a string argument for a smart contract constructor to the required value
 * @param BigNumberCtor The BigNumber constructor to use
 * @param value The string value to parse
 * @param type The type to parse the value into
 */
function parseArgument(
  BigNumberCtor: typeof BigNumber, value: string, type: string
): string | BigNumber | BigNumber[] {
  switch (type) {
    case 'string':
    case 'address':
      return value
    case 'uint64':
    case 'uint256':
      return BigNumberCtor.from(value)
    case 'uint64[]':
      return value.split(';').map(arrayValue => BigNumberCtor.from(arrayValue))
    default:
      throw new Error(`Unknown type: ${type}`)
  }
}

task<TaskParams>(
  'deploy-smart-contract',
  'Deploy a smart contract from a local file',
  async (taskArgs, env) => {
    const { name, arguments: constructorArguments } = taskArgs
    const contract = await env.ethers.getContractFactory(name)
    const deployParameters = contract.interface.deploy.inputs
    if (constructorArguments.length !== deployParameters.length) {
      throw new Error(`Arguments and argument types must have the same length. Required args: ${deployParameters.length}, provided args: ${constructorArguments.length}`)
    }
    const parsedArguments = constructorArguments.map((argument, i) => {
      const type = deployParameters[i].type
      return parseArgument(env.ethers.BigNumber, argument, type)
    })
    if (env.hardhatArguments.verbose) {
      console.log('Deploying smart contract %s with arguments %s', name, parsedArguments)
    }
    const deployed = await contract.deploy(...parsedArguments)
    await deployed.deployed()
    if (env.hardhatArguments.verbose) {
      console.log('Deployed smart contract to address %s', deployed.address)
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
            address: deployed.address,
            constructorArguments: parsedArguments
          })
        },
        5000,
        10,
        10_000 // It takes a _long_ time for block explorers to see the contract (on Goerli)
      )
      // TODO log out instructions on how to retry verification if it fails even after the retries
    }
    return deployed.address
  }).addParam(
  'name',
  'The name of the smart contract (not the filename but the name of the contract itself)',
  undefined, types.string)
  .addParam(
    'arguments',
    'The constructor argument values for the smart contract to be deployed, comma separated. If an argument is an array itself, provide the values semicolon separated.',
    [], StringArrayArgumentType, true)
  .addFlag('verify', 'Set to true if the smart contract should be verified after being deployed')
