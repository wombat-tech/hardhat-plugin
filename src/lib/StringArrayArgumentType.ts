import { CLIArgumentType } from 'hardhat/types'

/**
 * Argument type for hardhat that represents a string array separated by commas
 */
export const StringArrayArgumentType: CLIArgumentType<string[]> = {
  name: 'StringArray',

  parse(argName: string, strValue: string): string[] {
    return strValue.split(',')
  },

  validate(argName: string, argumentValue: unknown): void {
    if (!Array.isArray(argumentValue)) {
      throw new Error('Parsed argument is not an array')
    }
    argumentValue.forEach((v: unknown) => {
      if (typeof v !== 'string') {
        throw new Error('Parsed argument is an array but does not only containing strings')
      }
    })
  }
}
