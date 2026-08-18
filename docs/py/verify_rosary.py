import os
import sys
from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000/lab/rosary")
    page.wait_for_timeout(2000)

    # Click the "묵주기도 시작" or something similar if it exists
    # If the page has RosaryGuide directly, it might be visible.

    # Take screenshot of the initial state
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

    # Try to find the image (it has a style with cursor: pointer now if explanation is present)
    # The alt text is the step.title
    images = page.locator("img")
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
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

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
            context.close()  # MUST close context to save the video
            browser.close()
