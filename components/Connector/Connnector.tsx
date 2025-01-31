
import Head from 'next/head'

import React, { useState } from 'react'
import { Web3ReactProvider, useWeb3React, UnsupportedChainIdError } from '@web3-react/core'
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected
} from '@web3-react/injected-connector'
import { UserRejectedRequestError as UserRejectedRequestErrorWalletConnect } from '@web3-react/walletconnect-connector'
import { Web3Provider } from '@ethersproject/providers'
import { formatEther } from '@ethersproject/units'

import { useEagerConnect, useInactiveListener } from '../../utils/hooks'
import { injected, network, walletconnect } from '../../utils/connectors'

function getErrorMessage(error: Error) {
  if (error instanceof NoEthereumProviderError) {
    return 'No Wallet Browser Extension detected, install Browser Extension on desktop or visit from a dApp browser on mobile.'
  } else if (error instanceof UnsupportedChainIdError) {
    return "You're connected to an unsupported network."
  } else if (error instanceof UserRejectedRequestErrorInjected || UserRejectedRequestErrorWalletConnect) {
    return 'Please authorize this website to access your Wallet account.'
  } else {
    console.error(error)
    return 'An unknown error occurred. Check the console for more details.'
  }
}

function BlockNumber() {
  const { chainId, library } = useWeb3React()

  const [blockNumber, setBlockNumber] = React.useState<number>()
  React.useEffect((): any => {
    if (!!library) {
      let stale = false

      library
        .getBlockNumber()
        .then((blockNumber: number) => {
          if (!stale) {
            setBlockNumber(blockNumber)
          }
        })
        .catch(() => {
          if (!stale) {
            setBlockNumber(null)
          }
        })

      const updateBlockNumber = (blockNumber: number) => {
        setBlockNumber(blockNumber)
      }
      library.on('block', updateBlockNumber)

      return () => {
        stale = true
        library.removeListener('block', updateBlockNumber)
        setBlockNumber(undefined)
      }
    }
  }, [library, chainId]) // ensures refresh if referential identity of library doesn't change across chainIds

  return <span>{blockNumber === null ? 'Error' : blockNumber ?? '-'}</span>
}

function Account() {
  const { account } = useWeb3React()

  return (
    <span>
      {account === null ? '-' : account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : '-'}
    </span>
  )
}

function Balance() {
  const { account, library, chainId } = useWeb3React()

  const [balance, setBalance] = React.useState()
  React.useEffect((): any => {
    if (!!account && !!library) {
      let stale = false

      library
        .getBalance(account)
        .then((balance: any) => {
          if (!stale) {
            setBalance(balance)
          }
        })
        .catch(() => {
          if (!stale) {
            setBalance(null)
          }
        })

      return () => {
        stale = true
        setBalance(undefined)
      }
    }
  }, [account, library, chainId]) // ensures refresh if referential identity of library doesn't change across chainIds

  return <span>{balance === null ? null : balance ? formatEther(balance) : '-'}</span>
}

function Header() {
  const { active, error } = useWeb3React()

  const { account, library, chainId } = useWeb3React()

  return (
    <>
      <h5>Status: {active ? '🟢' : error ? '🔴' : '🟠'}</h5>
      <h5>chainId: {chainId ? chainId : '-'}</h5>
      <h5>
        BlockNumber: <BlockNumber />
      </h5>
      <h5>address: {account ? account : '-'}</h5>
      <h5>
        Balance:<Balance />
      </h5>
    </>
  )
}

function Connnector() {
  const context = useWeb3React<Web3Provider>()
  const { connector, library, chainId, account, activate, deactivate, active, error } = context

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = React.useState<any>()
  React.useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined)
    }
  }, [activatingConnector, connector])

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
  const triedEager = useEagerConnect()

  // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector)

  return (
    <>
      <Header />
      {active ? (
        <button
          style={{
            height: '3rem',
            marginTop: '2rem',
            borderRadius: '1rem',
            borderColor: 'red',
            cursor: 'pointer'
          }}
          onClick={() => {
            console.log("Disconnect!!!")
            deactivate()
          }}
        >
          Disconnect
        </button>
      ) : error ? (
        <button
          style={{
            height: '3rem',
            marginTop: '2rem',
            borderRadius: '1rem',
            borderColor: 'red',
            cursor: 'pointer'
          }}
          onClick={() => {
            deactivate()
          }}
        >
          Cancel Connect
        </button>
      ) :
        (
          'connect'
        )}
      <div
        style={{
          display: 'grid',
          gridGap: '1rem',
          gridTemplateColumns: '1fr 1fr',
          maxWidth: '20rem',
          margin: 'auto'
        }}
      >
        {/* Button */}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {!!error && <h4 style={{ marginTop: '1rem', marginBottom: '0' }}>{getErrorMessage(error)}</h4>}
      </div>

      <hr style={{ margin: '2rem' }} />

      <div
        style={{
          display: 'grid',
          gridGap: '1rem',
          gridTemplateColumns: 'fit-content',
          maxWidth: '20rem',
          margin: 'auto'
        }}
      >
        {!!(library && account) && (
          <button
            style={{
              height: '3rem',
              borderRadius: '1rem',
              cursor: 'pointer'
            }}
            onClick={() => {
              library
                .getSigner(account)
                .signMessage('👋')
                .then((signature: any) => {
                  window.alert(`Success!\n\n${signature}`)
                })
                .catch((error: any) => {
                  window.alert('Failure!' + (error && error.message ? `\n\n${error.message}` : ''))
                })
            }}
          >
            Sign Message
          </button>
        )}
      </div>
    </>
  )
}

export default Connnector;