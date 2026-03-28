#!/usr/bin/env python3
"""Take screenshots of the Auteursportaal for the pitch deck"""

from playwright.sync_api import sync_playwright
import subprocess, time, os, signal

OUT = '/Users/patrickjeeninga/Coding/Royaltyportaal/pitch/screenshots'
os.makedirs(OUT, exist_ok=True)

# Start local server
server = subprocess.Popen(
    ['python3', '-m', 'http.server', '8099'],
    cwd='/Users/patrickjeeninga/Coding/Royaltyportaal',
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
)
time.sleep(1)

BASE = 'http://localhost:8099/index.html'

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=2)
        page = ctx.new_page()

        # ── Login page ──
        page.goto(BASE)
        page.wait_for_timeout(2000)
        page.screenshot(path=f'{OUT}/01_login.png')
        print('✓ 01_login')

        # ── Login as Patrick ──
        page.fill('#email', 'patrick@noordhoff.nl')
        page.fill('#password', 'Patrick12345')
        page.click('#loginForm button[type="submit"]')
        page.wait_for_timeout(3000)

        # Close onboarding modal if present
        try:
            page.click('#onboardingModal .btn-primary', timeout=2000)
            page.wait_for_timeout(500)
        except: pass

        # ── Start tab ──
        page.screenshot(path=f'{OUT}/02_start.png')
        print('✓ 02_start')

        # ── Scroll to chart ──
        page.evaluate('window.scrollTo(0, 550)')
        page.wait_for_timeout(800)
        page.screenshot(path=f'{OUT}/03_chart.png')
        print('✓ 03_chart')

        # ── Scroll to events/news/academy ──
        page.evaluate('window.scrollTo(0, 1100)')
        page.wait_for_timeout(800)
        page.screenshot(path=f'{OUT}/04_events.png')
        print('✓ 04_events')

        # ── Afrekeningen tab ──
        page.click('.tab-btn[data-tab="payments"]')
        page.wait_for_timeout(1200)
        page.screenshot(path=f'{OUT}/05_afrekeningen.png')
        print('✓ 05_afrekeningen')

        # ── Contracten tab ──
        page.click('.tab-btn[data-tab="contracts"]')
        page.wait_for_timeout(1200)
        page.screenshot(path=f'{OUT}/06_contracten.png')
        print('✓ 06_contracten')

        # ── Prognose tab ──
        page.click('.tab-btn[data-tab="forecast"]')
        page.wait_for_timeout(1200)
        page.screenshot(path=f'{OUT}/07_prognose.png')
        print('✓ 07_prognose')

        # ── Declaraties tab ──
        page.click('.tab-btn[data-tab="expenses"]')
        page.wait_for_timeout(1200)
        page.screenshot(path=f'{OUT}/08_declaraties.png')
        print('✓ 08_declaraties')

        # ── Profiel tab ──
        page.click('.tab-btn[data-tab="info"]')
        page.wait_for_timeout(1200)
        page.screenshot(path=f'{OUT}/09_profiel.png')
        print('✓ 09_profiel')

        # ── Logout and login as admin ──
        # Click profile menu
        page.click('#headerProfile')
        page.wait_for_timeout(500)
        # Click logout
        page.click('#logoutBtn')
        page.wait_for_timeout(2000)

        page.fill('#email', 'admin@noordhoff.nl')
        page.fill('#password', 'Admin12345')
        page.click('#loginForm button[type="submit"]')
        page.wait_for_timeout(3000)

        # ── Admin dashboard ──
        page.screenshot(path=f'{OUT}/10_admin.png')
        print('✓ 10_admin')

        # ── Admin scroll to beheer ──
        page.evaluate('window.scrollTo(0, 700)')
        page.wait_for_timeout(800)
        page.screenshot(path=f'{OUT}/11_admin_beheer.png')
        print('✓ 11_admin_beheer')

        browser.close()
        print(f'\n✓ All screenshots saved to {OUT}/')

finally:
    server.terminate()
    server.wait()
