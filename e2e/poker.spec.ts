import { test, expect } from '@playwright/test';

test.describe('Poke-a-Point Planning Poker E2E Suite', () => {
  test('Full multi-user poker workflow with real-time sync, host privileges, and refresh persistence', async ({ browser }) => {
    // Context 1: Alice (Host)
    const aliceContext = await browser.newContext();
    const alicePage = await aliceContext.newPage();

    await alicePage.goto('/');
    await expect(alicePage.getByText('Agile Teams, Simplified!')).toBeVisible();

    // 1. Alice Creates Room
    await alicePage.click('text=Create Room');
    await expect(alicePage).toHaveURL(/\/create/);

    await alicePage.fill('label:has-text("Room Name") + div input, input[label="Room Name"]', 'Sprint 100 Planning');
    await alicePage.fill('label:has-text("Your Name") + div input, input[label="Your Name"]', 'Alice');
    await alicePage.click('button[type="submit"], button:has-text("Create Room")');

    // Verify redirected to room page
    await expect(alicePage).toHaveURL(/\/room\/.+/);
    await expect(alicePage.getByText('Sprint 100 Planning')).toBeVisible();
    await expect(alicePage.getByText('Session Host')).toBeVisible();

    // Get room URL for Bob
    const roomUrl = alicePage.url();
    const roomId = roomUrl.split('/room/')[1];

    // Context 2: Bob (Participant)
    const bobContext = await browser.newContext();
    const bobPage = await bobContext.newPage();

    // 2. Bob joins via Join link
    await bobPage.goto(`/join?roomId=${roomId}`);
    await expect(bobPage.getByText('Join a Room')).toBeVisible();

    await bobPage.fill('label:has-text("Your Name") + div input, input[label="Your Name"]', 'Bob');
    await bobPage.click('button[type="submit"], button:has-text("Join Room")');

    // Verify Bob is in room and host controls are NOT visible to Bob
    await expect(bobPage).toHaveURL(/\/room\/.+/);
    await expect(bobPage.getByText('Logged in as Bob')).toBeVisible();
    await expect(bobPage.getByText('Show Points')).not.toBeVisible();
    await expect(bobPage.getByText('Reset All Votes')).not.toBeVisible();

    // 3. Real-time participant sync (Alice and Bob both see 2 team members)
    await expect(alicePage.getByText('2 Online')).toBeVisible({ timeout: 5000 });
    await expect(bobPage.getByText('2 Online')).toBeVisible({ timeout: 5000 });

    // 4. Voting: Alice votes 5, Bob votes 8
    await alicePage.click('button:has-text("5")');
    // Bob should see Alice's status update to Vote Submitted / Voted
    await expect(bobPage.getByText('Vote Submitted').first()).toBeVisible({ timeout: 5000 });

    await bobPage.click('button:has-text("8")');
    // Alice should see Bob's status update to Vote Submitted / Voted
    await expect(alicePage.getByText('Vote Submitted').nth(1)).toBeVisible({ timeout: 5000 });

    // 5. Host Reveals Points
    await alicePage.click('button:has-text("Show Points")');

    // Both should see average calculation ( (5+8)/2 = 6.5 )
    await expect(alicePage.getByText('Average: 6.5 Story Points')).toBeVisible();
    await expect(bobPage.getByText('Average: 6.5 Story Points')).toBeVisible();

    // 6. Host Resets Votes
    await alicePage.click('button:has-text("Reset All Votes")');

    // Average should disappear and cards reset
    await expect(alicePage.getByText('Average: 6.5 Story Points')).not.toBeVisible();
    await expect(bobPage.getByText('Average: 6.5 Story Points')).not.toBeVisible();

    // 7. Page Refresh & Host Retention
    await alicePage.reload();
    await expect(alicePage.getByText('Sprint 100 Planning')).toBeVisible();
    await expect(alicePage.getByText('Session Host')).toBeVisible();
    await expect(alicePage.getByText('Logged in as Alice')).toBeVisible();

    await aliceContext.close();
    await bobContext.close();
  });

  test('T-Shirt sizing estimation scale workflow', async ({ page }) => {
    await page.goto('/create');
    await page.fill('label:has-text("Room Name") + div input, input[label="Room Name"]', 'Design Sprint');
    await page.fill('label:has-text("Your Name") + div input, input[label="Your Name"]', 'Charlie');

    // Select T-Shirt Scale
    await page.click('.MuiSelect-select');
    await page.click('li[data-value="tshirt"]');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/room\/.+/);
    await expect(page.getByText('Design Sprint')).toBeVisible();

    // Vote M
    await page.getByRole('button', { name: 'M', exact: true }).click();
    await page.click('button:has-text("Show Points")');

    await expect(page.getByText('Most Popular Vote: M')).toBeVisible();
  });
});
