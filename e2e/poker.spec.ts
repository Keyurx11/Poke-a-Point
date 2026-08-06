import { test, expect, Page } from '@playwright/test';
import { io as ioClient } from '../frontend/node_modules/socket.io-client';

/**
 * Shared helper to navigate to room creation, fill details, and submit.
 */
async function createRoomHelper(
  page: Page,
  roomName: string,
  userName: string,
  options?: { scale?: 'tshirt' | 'fibonacci'; autoReveal?: boolean }
) {
  await page.goto('/create');
  await page.fill('label:has-text("Room Name") + div input, input[label="Room Name"]', roomName);
  await page.fill('label:has-text("Your Name") + div input, input[label="Your Name"]', userName);

  if (options?.scale === 'tshirt') {
    await page.click('.MuiSelect-select');
    await page.click('li[data-value="tshirt"]');
  }

  if (options?.autoReveal) {
    await page.click('label:has-text("Auto-reveal points when all team members vote")');
  }

  await page.click('button[type="submit"], button:has-text("Create Room")');
  await expect(page).toHaveURL(/\/room\/.+/);
  await expect(page.getByText(roomName)).toBeVisible();
}

/**
 * Shared helper to join an existing room by URL.
 */
async function joinRoomHelper(page: Page, roomUrl: string, userName: string) {
  const roomId = roomUrl.split('/room/')[1];
  await page.goto(`/join?roomId=${roomId}`);
  await page.fill('label:has-text("Your Name") + div input, input[label="Your Name"]', userName);
  await page.click('button[type="submit"], button:has-text("Join Room")');
  await expect(page).toHaveURL(/\/room\/.+/);
}

test.describe('Poke-a-Point Planning Poker E2E Suite', () => {
  test('Full multi-user poker workflow with real-time sync, host privileges, and refresh persistence', async ({ browser }) => {
    // Context 1: Alice (Host)
    const aliceContext = await browser.newContext();
    const alicePage = await aliceContext.newPage();

    await alicePage.goto('/');
    await expect(alicePage.getByText('Agile Teams, Simplified!')).toBeVisible();

    // 1. Alice Creates Room
    await createRoomHelper(alicePage, 'Sprint 100 Planning', 'Alice');
    await expect(alicePage.getByTestId('host-badge')).toBeVisible();

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
    await expect(bobPage.getByTestId('user-profile-chip')).toBeVisible();
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
    await expect(alicePage.getByText('Average Story Points')).toBeVisible();
    await expect(alicePage.getByTestId('vote-stats-value')).toHaveText('6.5');
    await expect(bobPage.getByText('Average Story Points')).toBeVisible();
    await expect(bobPage.getByTestId('vote-stats-value')).toHaveText('6.5');

    // 6. Host Resets Votes for Next Round
    await alicePage.click('button:has-text("Next Round")');

    // Average should disappear and the voting card panel should return
    await expect(alicePage.getByTestId('vote-stats-value')).not.toBeVisible();
    await expect(bobPage.getByTestId('vote-stats-value')).not.toBeVisible();
    await expect(alicePage.getByText('Cast Your Vote')).toBeVisible();

    // 7. Page Refresh & Host Retention
    await alicePage.reload();
    await expect(alicePage.getByText('Sprint 100 Planning')).toBeVisible();
    await expect(alicePage.getByTestId('host-badge')).toBeVisible();
    await expect(alicePage.getByTestId('user-profile-chip')).toBeVisible();

    await aliceContext.close();
    await bobContext.close();
  });

  test('T-Shirt sizing estimation scale workflow', async ({ page }) => {
    await createRoomHelper(page, 'Design Sprint', 'Charlie', { scale: 'tshirt' });

    // Vote M
    await page.getByRole('button', { name: 'M', exact: true }).click();
    await page.click('button:has-text("Show Points")');

    await expect(page.getByText('Most Popular Vote')).toBeVisible();
    await expect(page.getByTestId('vote-stats-value')).toHaveText('M');
  });

  test('Auto-reveal and 100% Consensus banner workflow', async ({ page }) => {
    await createRoomHelper(page, 'Consensus Room', 'Dave', { autoReveal: true });

    // Vote 8
    await page.getByRole('button', { name: '8', exact: true }).click();

    // Auto-reveal should trigger and display consensus banner automatically
    await expect(page.getByText('100% Consensus Reached! Team agreed on 8')).toBeVisible({ timeout: 5000 });
  });

  test('Clicking the ROOM CODE chip copies the invite link to the clipboard', async ({ browser }) => {
    const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();

    await createRoomHelper(page, 'Clipboard Room', 'Frank');

    const roomId = page.url().split('/room/')[1];

    await page.getByTestId('room-code-chip').click();
    await expect(page.getByText('Room invite link copied to clipboard!')).toBeVisible();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(`${new URL(page.url()).origin}/join?roomId=${roomId}`);

    await context.close();
  });

  test('Selected vote card stays highlighted after a refresh while points are hidden', async ({ page }) => {
    await createRoomHelper(page, 'Refresh Room', 'Grace');

    const voteButton = page.getByRole('button', { name: '13', exact: true });
    await voteButton.click();
    await expect(voteButton).toHaveClass(/MuiButton-contained/);

    // Points are still hidden at this point — refreshing must not lose the visual selection
    await expect(page.getByText('Voting Results (Hidden)')).toBeVisible();
    await page.reload();
    await expect(page.getByText('Team Members')).toBeVisible();

    const voteButtonAfterReload = page.getByRole('button', { name: '13', exact: true });
    await expect(voteButtonAfterReload).toHaveClass(/MuiButton-contained/);
  });

  test('A socket that never joined the room cannot vote, reset votes, toggle reveal, or toggle auto-reveal', async ({ page, baseURL }) => {
    // Set up a real room with a real host, via the UI, so there is something to attack.
    await createRoomHelper(page, 'Auth Boundary Room', 'Hank');
    const roomId = page.url().split('/room/')[1];

    await page.getByRole('button', { name: '3', exact: true }).click();
    await expect(page.getByText('Vote Submitted')).toBeVisible();

    // A raw socket connection that never calls joinRoom for this room
    const stranger = ioClient(baseURL!);
    await new Promise<void>((resolve) => stranger.on('connect', () => resolve()));

    // Attempt unauthorized vote forgery
    const voteResponse = await new Promise<{ success: boolean; error?: string }>((resolve) => {
      stranger.emit('vote', { roomId, userId: 'some-victim-id', vote: 21 }, resolve);
    });
    expect(voteResponse.success).toBe(false);
    expect(voteResponse.error).toMatch(/Unauthorized/);

    const resetResponse = await new Promise<{ success: boolean; error?: string }>((resolve) => {
      stranger.emit('resetVotes', { roomId }, resolve);
    });
    expect(resetResponse.success).toBe(false);
    expect(resetResponse.error).toMatch(/Unauthorized/);

    const toggleResponse = await new Promise<{ success: boolean; error?: string }>((resolve) => {
      stranger.emit('toggleVotes', { roomId, showVotes: true }, resolve);
    });
    expect(toggleResponse.success).toBe(false);
    expect(toggleResponse.error).toMatch(/Unauthorized/);

    const autoRevealResponse = await new Promise<{ success: boolean; error?: string }>((resolve) => {
      stranger.emit('toggleAutoReveal', { roomId, autoReveal: true }, resolve);
    });
    expect(autoRevealResponse.success).toBe(false);
    expect(autoRevealResponse.error).toMatch(/Unauthorized/);

    // Confirm the attack had no effect: Hank's vote is still there and still hidden.
    await expect(page.getByText('Vote Submitted')).toBeVisible();
    await expect(page.getByText('Voting Results (Hidden)')).toBeVisible();

    stranger.disconnect();
  });

  test('Toggling to Observer hides voting controls and the server refuses observer votes', async ({ page, baseURL }) => {
    await createRoomHelper(page, 'Observer UI Room', 'Ivy');
    const roomId = page.url().split('/room/')[1];
    const userId = await page.evaluate(() => localStorage.getItem('userId'));

    await page.getByTestId('observer-toggle').click();
    await expect(page.getByText('Observer Mode')).toBeVisible();
    await expect(page.getByText("You’re spectating this round.")).toBeVisible();

    // Defense in depth: even if a client bypassed the UI, the server itself must reject the vote.
    const stranger = ioClient(baseURL!);
    await new Promise<void>((resolve) => stranger.on('connect', () => resolve()));
    const voteResponse = await new Promise<{ success: boolean; error?: string }>((resolve) => {
      stranger.emit('joinRoom', { roomId, userName: 'Ivy', userId }, () => {
        stranger.emit('vote', { roomId, userId, vote: 5 }, resolve);
      });
    });
    expect(voteResponse.success).toBe(false);
    expect(voteResponse.error).toMatch(/Observers cannot vote/);
    stranger.disconnect();
  });

  test('Switching to Observer can complete an in-progress auto-reveal', async ({ browser }) => {
    const aliceContext = await browser.newContext();
    const alicePage = await aliceContext.newPage();
    await createRoomHelper(alicePage, 'Observer Room', 'Ivy', { autoReveal: true });
    const roomId = alicePage.url().split('/room/')[1];

    const bobContext = await browser.newContext();
    const bobPage = await bobContext.newPage();
    await bobPage.goto(`/join?roomId=${roomId}`);
    await bobPage.fill('label:has-text("Your Name") + div input, input[label="Your Name"]', 'Bob');
    await bobPage.click('button[type="submit"], button:has-text("Join Room")');
    await expect(bobPage).toHaveURL(/\/room\/.+/);

    // Alice votes; Bob hasn't, so auto-reveal must not fire yet
    await alicePage.click('button:has-text("5")');
    await expect(bobPage.getByText('Vote Submitted').first()).toBeVisible({ timeout: 5000 });
    await expect(alicePage.getByText('Voting Results (Hidden)')).toBeVisible();

    // Bob switches to Observer instead of voting. He is now excluded from the voter pool,
    // which leaves Alice as the only voter — and she has already voted. That should
    // complete the "everyone voted" condition and trigger auto-reveal immediately,
    // not only on the next vote event (regression coverage for that gap).
    await bobPage.getByTestId('observer-toggle').click();
    await expect(alicePage.getByText('Voting Results (Hidden)')).not.toBeVisible({ timeout: 5000 });
    await expect(alicePage.getByTestId('vote-stats-value')).toHaveText('5');

    // Observers are excluded from the voter/observer counts
    await expect(alicePage.getByText('1 Voter · 1 Observer')).toBeVisible();

    await aliceContext.close();
    await bobContext.close();
  });

  test('Vote values are masked to other users before reveal but visible to the voter themselves', async ({ page, baseURL }) => {
    await createRoomHelper(page, 'Masking Room', 'Ivy');
    const roomId = page.url().split('/room/')[1];

    const sockA = ioClient(baseURL!);
    const sockB = ioClient(baseURL!);
    await Promise.all([
      new Promise<void>((resolve) => sockA.on('connect', () => resolve())),
      new Promise<void>((resolve) => sockB.on('connect', () => resolve())),
    ]);

    const userA = 'mask-test-user-a';
    const userB = 'mask-test-user-b';

    // Track the latest personalized votesUpdate each socket has seen. Using persistent
    // listeners + polling (rather than a one-shot .once() per vote) avoids a race where a
    // still-in-flight event from an earlier broadcast is mistaken for the next one.
    let latestForA: Record<string, unknown> = {};
    let latestForB: Record<string, unknown> = {};
    sockA.on('votesUpdate', (v: Record<string, unknown>) => { latestForA = v; });
    sockB.on('votesUpdate', (v: Record<string, unknown>) => { latestForB = v; });

    await new Promise<void>((resolve) => sockA.emit('joinRoom', { roomId, userName: 'UserA', userId: userA }, () => resolve()));
    await new Promise<void>((resolve) => sockB.emit('joinRoom', { roomId, userName: 'UserB', userId: userB }, () => resolve()));

    // UserA votes; UserB should only see that a vote was cast, not its value
    await new Promise<void>((resolve) => sockA.emit('vote', { roomId, userId: userA, vote: 5 }, () => resolve()));
    await expect.poll(() => latestForB[userA]).toBe(true);

    // UserA should see their own real vote value in the very same (still-hidden) round
    await new Promise<void>((resolve) => sockB.emit('vote', { roomId, userId: userB, vote: 3 }, () => resolve()));
    await expect.poll(() => latestForA[userB]).toBe(true);
    expect(latestForA[userA]).toBe(5);

    sockA.disconnect();
    sockB.disconnect();
  });

  test('Host leaving room transfers host privileges to next participant', async ({ browser }) => {
    const aliceContext = await browser.newContext();
    const bobContext = await browser.newContext();
    const alicePage = await aliceContext.newPage();
    const bobPage = await bobContext.newPage();

    await createRoomHelper(alicePage, 'Host Transfer Room', 'Alice');
    const roomUrl = alicePage.url();

    await joinRoomHelper(bobPage, roomUrl, 'Bob');
    await expect(bobPage.getByText('2 Online')).toBeVisible({ timeout: 5000 });

    // Verify Bob is not host initially
    await expect(bobPage.getByText('Show Points')).not.toBeVisible();

    // Alice leaves room via user profile menu
    await alicePage.getByTestId('user-profile-chip').click();
    await alicePage.getByText('Leave Room').click();

    // Alice is redirected to Home
    await expect(alicePage).toHaveURL('/');

    // Bob receives room update and becomes Host (Host badge & Show Points button become visible)
    await expect(bobPage.getByTestId('host-badge')).toBeVisible({ timeout: 5000 });
    await expect(bobPage.getByText('Show Points')).toBeVisible();

    await aliceContext.close();
    await bobContext.close();
  });

  test('Host ending session broadcasts sessionEnded and redirects participants home', async ({ browser }) => {
    const aliceContext = await browser.newContext();
    const bobContext = await browser.newContext();
    const alicePage = await aliceContext.newPage();
    const bobPage = await bobContext.newPage();

    // Handle dialog alert for Bob when session ends
    bobPage.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await createRoomHelper(alicePage, 'End Session Room', 'Alice');
    const roomUrl = alicePage.url();

    await joinRoomHelper(bobPage, roomUrl, 'Bob');
    await expect(bobPage.getByText('2 Online')).toBeVisible({ timeout: 5000 });

    // Alice ends session via user profile menu
    await alicePage.getByTestId('user-profile-chip').click();
    await alicePage.getByText('End Session', { exact: true }).click();

    // Both pages navigate away from the room
    await expect(alicePage).toHaveURL('/');
    await expect(bobPage).toHaveURL('/', { timeout: 5000 });

    await aliceContext.close();
    await bobContext.close();
  });
});
