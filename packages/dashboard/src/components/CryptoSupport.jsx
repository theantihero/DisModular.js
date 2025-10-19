/**
 * CryptoSupport Component
 * Beautiful crypto donation support modal with space theme
 * @author fkndean_
 * @date 2025-01-27
 */

import React, { useState } from 'react';

const wallets = [
  {
    name: 'XRP',
    addresses: [
      { address: 'rUgyAZ58EYJgpaLr9jTerjBJ5ViveBvLB', network: null, networkIcon: null, note: 'No tag needed' }
    ],
    color: 'from-blue-500 to-blue-600',
    icon: '/assets/wallets/xrp.png'
  },
  {
    name: 'Bitcoin',
    addresses: [
      { address: 'bc1qmvcwf3uxkajnnfd6aw4w0zersu9g03ut8untcq', network: null, networkIcon: null }
    ],
    color: 'from-orange-400 to-orange-500',
    icon: '/assets/wallets/btc.png'
  },
  {
    name: 'Ethereum',
    addresses: [
      { address: '0xe386DE88C508dd415237a766adAE71F3bb1CB820', network: null, networkIcon: null }
    ],
    color: 'from-purple-500 to-purple-600',
    icon: '/assets/wallets/eth.png'
  },
  {
    name: 'USDT',
    addresses: [
      { address: '0xe386DE88C508dd415237a766adAE71F3bb1CB820', network: 'ETH Network', networkIcon: '/assets/wallets/eth.png' },
      { address: 'TBxUGe5k5TP3ZKqCfNE788HXFgzv6xYfNY', network: 'Tron Network', networkIcon: '/assets/wallets/trx.png' }
    ],
    color: 'from-green-500 to-green-600',
    icon: '/assets/wallets/usdt.png'
  },
  {
    name: 'Solana',
    addresses: [
      { address: '6H31aLAUv48idDZPAhJNH29EytbefmronJTTFDBWeGUy', network: null, networkIcon: null }
    ],
    color: 'from-indigo-500 to-indigo-600',
    icon: '/assets/wallets/sol.png'
  },
  {
    name: 'USDC',
    addresses: [
      { address: '6H31aLAUv48idDZPAhJNH29EytbefmronJTTFDBWeGUy', network: 'Solana Network', networkIcon: '/assets/wallets/sol.png' },
      { address: '0xe386DE88C508dd415237a766adAE71F3bb1CB820', network: 'ETH Network', networkIcon: '/assets/wallets/eth.png' }
    ],
    color: 'from-blue-400 to-blue-500',
    icon: '/assets/wallets/usdc.png'
  },
  {
    name: 'Dogecoin',
    addresses: [
      { address: 'DBqvqFL33ZTkpSGcb4etDgCXqqNzkrz6NJ', network: null, networkIcon: null }
    ],
    color: 'from-yellow-400 to-yellow-500',
    icon: '/assets/wallets/doge.png'
  },
  {
    name: 'Litecoin',
    addresses: [
      { address: 'LcQHkipCnfSYetogvBT7UKNXiiybE9HL5f', network: null, networkIcon: null }
    ],
    color: 'from-gray-400 to-gray-500',
    icon: '/assets/wallets/ltc.png'
  }
];

export default function CryptoSupport({ isOpen, onClose }) {
  const [copiedAddress, setCopiedAddress] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState('XRP');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const copyToClipboard = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const selectedWallet = wallets.find(wallet => wallet.name === selectedCrypto);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[90vh] glass-strong cosmic-border rounded-2xl shadow-2xl backdrop-blur-xl animate-scale-in flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="holographic-glow bg-gradient-to-r from-nebula-purple/90 to-hologram-500/90 backdrop-blur-xl px-6 py-4 rounded-t-2xl border-b border-hologram-500/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Support DisModular</h2>
              <p className="text-hologram-cyan text-sm">Choose your preferred cryptocurrency to support the project</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-3 rounded-xl glass hover:glass-strong text-white hover:scale-105 transition-all duration-300"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {/* Crypto Selector Dropdown */}
          <div className="mb-4">
            <label className="block text-base font-semibold text-hologram-cyan mb-2">
              Select Cryptocurrency:
            </label>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 glass border border-hologram-500/30 rounded-xl text-left text-white hover:glass-strong transition-all duration-200"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-6 h-6 rounded-lg glass flex items-center justify-center p-1 border border-hologram-500/30 flex-shrink-0">
                    <img src={selectedWallet?.icon} alt={selectedWallet?.name} className="w-4 h-4 object-contain" />
                  </div>
                  <span className="font-medium text-sm truncate">{selectedCrypto}</span>
                  {selectedWallet?.addresses.length > 1 && (
                    <span className="text-xs text-hologram-cyan">
                      ({selectedWallet.addresses.length} networks)
                    </span>
                  )}
                </div>
                <span className={`text-lg transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 glass-strong cosmic-border rounded-xl shadow-2xl z-20 overflow-hidden backdrop-blur-xl animate-slide-down">
                  {wallets.map((wallet) => (
                    <button
                      key={wallet.name}
                      onClick={() => {
                        setSelectedCrypto(wallet.name);
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:glass transition-all duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg glass flex items-center justify-center p-1.5 border border-hologram-500/30 flex-shrink-0">
                        <img src={wallet.icon} alt={wallet.name} className="w-6 h-6 object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-white text-lg">{wallet.name}</span>
                        {wallet.addresses.length > 1 && (
                          <span className="text-sm text-hologram-cyan ml-2">
                            ({wallet.addresses.length} networks)
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Crypto Card */}
          <div key={selectedCrypto} className="group relative glass-strong cosmic-border rounded-2xl p-6 hover:glass-stronger hover:shadow-2xl hover:shadow-hologram-500/20 hover:holographic-glow transition-all duration-300 animate-fade-in">
            {/* Gradient accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${selectedWallet?.color} rounded-t-2xl`} />
            
            <div className="flex items-start gap-6">
              <div className="flex-1 min-w-0">
                {/* Coin info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center shadow-lg p-3 border border-hologram-500/30 flex-shrink-0 group-hover:holographic-glow transition-all duration-300">
                    <img src={selectedWallet?.icon} alt={selectedWallet?.name} className="w-12 h-12 object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-2xl tracking-tight mb-1">
                      {selectedWallet?.name}
                    </h3>
                    {selectedWallet?.addresses.length > 1 && (
                      <p className="text-lg text-hologram-cyan font-medium">
                        {selectedWallet.addresses.length} networks available
                      </p>
                    )}
                  </div>
                </div>

                {/* Addresses */}
                <div className="space-y-6">
                  {selectedWallet?.addresses.map((addressData, addrIndex) => (
                    <div key={addrIndex} className="space-y-3">
                      {addressData.network && (
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center p-2 border border-hologram-500/30 group-hover:holographic-glow transition-all duration-300">
                            <img src={addressData.networkIcon} alt={addressData.network} className="w-6 h-6 object-contain" />
                          </div>
                          <p className="text-xl font-semibold text-hologram-cyan">
                            {addressData.network}
                          </p>
                        </div>
                      )}
                      <div className="flex flex-col gap-4">
                        <code className="text-base font-mono glass px-6 py-5 rounded-xl text-white break-all border border-hologram-500/30 shadow-inner">
                          {addressData.address}
                        </code>
                        <div className="flex gap-3 justify-start">
                          {/* Copy button */}
                          <button
                            onClick={() => copyToClipboard(addressData.address)}
                            className={`px-6 py-4 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 ${
                              copiedAddress === addressData.address
                                ? 'bg-energy-green/20 text-energy-green border border-energy-green/30'
                                : 'glass text-hologram-cyan hover:glass-strong border border-hologram-500/30 hover:border-hologram-500/50 hover:holographic-glow'
                            }`}
                            title="Copy address"
                          >
                            {copiedAddress === addressData.address ? (
                              <span className="text-lg">✓</span>
                            ) : (
                              <span className="text-lg">📋</span>
                            )}
                            <span className="text-base font-medium">
                              {copiedAddress === addressData.address ? 'Copied!' : 'Copy'}
                            </span>
                          </button>
                        </div>
                      </div>
                      {addressData.note && (
                        <p className="text-base text-hologram-cyan italic glass px-4 py-3 rounded-lg border border-hologram-500/20">
                          💡 {addressData.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Thank you message */}
          <div className="mt-6 p-6 glass-strong cosmic-border rounded-2xl shadow-lg hover:holographic-glow transition-all duration-300 animate-fade-in">
            <p className="text-center text-white text-lg font-medium">
              <span className="text-3xl mr-2">💙</span>
              Thank you for supporting DisModular! Your contribution helps keep the service running and enables new features.
            </p>
          </div>

          {/* VIP Role Information */}
          <div className="mt-6 p-6 glass-strong cosmic-border rounded-2xl shadow-lg hover:holographic-glow transition-all duration-300 animate-fade-in">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 flex items-center justify-center flex-shrink-0 border border-yellow-500/30">
                <span className="text-2xl">👑</span>
              </div>
              <h3 className="text-2xl font-bold text-white">
                VIP Role Available!
              </h3>
            </div>
            <p className="text-hologram-cyan text-lg leading-relaxed mb-4">
              After donating, contact <span className="font-semibold text-energy-green">fkndean_</span> on Discord to receive your VIP role! 
              VIP members get priority support and exclusive features.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-base text-hologram-cyan">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-energy-green rounded-full"></span>
                <span>Discord: fkndean_</span>
              </div>
              <span className="hidden sm:inline mx-2">•</span>
              <span>Include your transaction hash for verification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}