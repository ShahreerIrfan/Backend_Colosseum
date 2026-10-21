#!/usr/bin/env python3
"""
Automated VPS Deployment Script for Colosseum Backend (TypeScript)
Deploys Dockerized Node.js + MongoDB stack to VPS (165.99.219.254)
"""

import os
import sys
import time
import subprocess
import pexpect

VPS_HOST = os.getenv("VPS_HOST", "187.126.3.18")
VPS_USER = os.getenv("VPS_USER", "root")
VPS_PASS = os.getenv("VPS_PASS", "1q2w3E#appvps")
REMOTE_DIR = "/opt/colosseum/backend"
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))

def run_ssh_command(cmd, timeout=60):
    ssh_cmd = f"ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 {VPS_USER}@{VPS_HOST} '{cmd}'"
    print(f"📡 Executing on {VPS_HOST}: {cmd}")
    child = pexpect.spawn(ssh_cmd, timeout=timeout)
    while True:
        idx = child.expect([
            r"[Pp]assword:",
            r"Are you sure you want to continue connecting",
            pexpect.EOF,
            pexpect.TIMEOUT
        ])
        if idx == 0:
            child.sendline(VPS_PASS)
        elif idx == 1:
            child.sendline("yes")
        elif idx == 2:
            output = child.before.decode(errors="replace")
            print(output)
            child.close()
            return child.exitstatus == 0, output
        elif idx == 3:
            print("⏱️ Command timed out!")
            child.close(force=True)
            return False, "Timeout"

def upload_code():
    print("📦 Packaging backend code into colosseum-backend.tar.gz...")
    subprocess.run([
        "tar", "-czf", "/tmp/colosseum-backend.tar.gz",
        "--exclude=node_modules",
        "--exclude=dist",
        "--exclude=.git",
        "--exclude=coverage",
        "."
    ], cwd=LOCAL_DIR, check=True)

    print("🚀 Uploading tarball to VPS...")
    scp_cmd = f"scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 /tmp/colosseum-backend.tar.gz {VPS_USER}@{VPS_HOST}:/tmp/"
    child = pexpect.spawn(scp_cmd, timeout=60)
    while True:
        idx = child.expect([
            r"[Pp]assword:",
            r"Are you sure you want to continue connecting",
            pexpect.EOF,
            pexpect.TIMEOUT
        ])
        if idx == 0:
            child.sendline(VPS_PASS)
        elif idx == 1:
            child.sendline("yes")
        elif idx == 2:
            child.close()
            return child.exitstatus == 0
        elif idx == 3:
            print("⏱️ SCP timed out!")
            child.close(force=True)
            return False

def main():
    print(f"==================================================")
    print(f"🚀 Deploying Colosseum Backend (TypeScript) to {VPS_HOST}")
    print(f"==================================================")

    # 1. Test ping / connection
    print("🔍 Testing connection...")
    success, out = run_ssh_command("uname -a", timeout=15)
    if not success:
        print(f"❌ Could not connect to {VPS_HOST} via SSH.")
        print(f"   Reason: {out.strip()}")
        print("\n💡 Please check if:")
        print("   1. The VPS is powered on in your hosting provider console.")
        print("   2. Port 22 is open in the provider firewall / security group.")
        print(f"   3. The IP address ({VPS_HOST}) is correct.")
        sys.exit(1)

    # 2. Check & Install Docker on VPS
    print("🐳 Verifying Docker on VPS...")
    run_ssh_command("which docker || (apt-get update -y && apt-get install -y docker.io docker-compose-v2)", timeout=300)
    run_ssh_command("ufw allow 3000/tcp || true", timeout=30)

    # 3. Upload code
    if not upload_code():
        print("❌ Failed to upload code.")
        sys.exit(1)

    # 4. Extract and start containers
    deploy_cmd = (
        f"mkdir -p {REMOTE_DIR} && "
        f"tar -xzf /tmp/colosseum-backend.tar.gz -C {REMOTE_DIR} && "
        f"cd {REMOTE_DIR} && "
        f"docker compose down || true && "
        f"docker compose up -d --build && "
        f"echo 'Waiting for services to become healthy...' && "
        f"sleep 15 && "
        f"docker compose ps && "
        f"for i in $(seq 1 10); do curl -s http://localhost:3000/api/v1/health && break || sleep 3; done"
    )
    print("🚀 Deploying and starting containers via Docker Compose...")
    success, out = run_ssh_command(deploy_cmd, timeout=400)
    if success:
        print("🎉 Deployment completed successfully!")
        print(f"🔗 Public URL: http://{VPS_HOST}:3000/api/v1/health")
        print(f"📦 Tour Bundle: http://{VPS_HOST}:3000/api/v1/tours/bundle")
    else:
        print("❌ Deployment command failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
