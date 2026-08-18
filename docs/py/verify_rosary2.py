import os
import sys
from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000")
    # Wait for splash screen to disappear
    page.wait_for_timeout(3000)

    # Click 묵주기도 (Rosary) in home page
    rosary_btn = page.get_by_text("묵주기도")
    if rosary_btn.count() > 0:
        rosary_btn.click()
        page.wait_for_timeout(2000)

    # Click image (it should be the mystery image, but let's be more specific)
    images = page.locator("img[src*='/images/rosary/']")

    # We might need to click "Next" a few times to reach the announcement screen.
    # The first screen is Apostles Creed. The 6th screen is the 1st mystery.
    for _ in range(6):
        next_btn = page.locator("button[aria-label='다음']")
        if next_btn.count() > 0:
            next_btn.click()
            page.wait_for_timeout(500)

    # Now we should be on the 1st decade mystery
    if images.count() > 0:
        images.first.click()
        page.wait_for_timeout(1000)
        page.screenshot(path="/home/jules/verification/screenshots/full_screen.png")
        page.wait_for_timeout(1000)

        # Try to close it
        close_btn = page.locator("button[aria-label='닫기']")
        if close_btn.count() > 0:
            close_btn.click()
            page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={'width': 375, 'height': 812} # mobile view
        )
        page = context.new_page()
        try:
            run_cuj(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            context.close()
            browser.close()
