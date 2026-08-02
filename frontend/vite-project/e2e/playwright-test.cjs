const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const logs = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    logs.push({ type: 'console', text: msg.text() });
  });

  page.on('pageerror', (err) => {
    logs.push({ type: 'pageerror', text: err.message });
  });

  page.on('response', async (response) => {
    try {
      const url = response.url();
      if (url.includes('/api/')) {
        const status = response.status();
        let body = '';
        try {
          body = await response.text();
        } catch (e) {
          body = '<unreadable>';
        }
        logs.push({ type: 'response', url, status, body });
      }
    } catch (e) {
      logs.push({ type: 'error', text: 'response handler error: ' + e.message });
    }
  });

  const outPath = 'c:\\Users\\Admin\\Desktop\\Code\\New folder\\LMS\\frontend\\vite-project\\e2e\\playwright-result.json';

  try {
    const BASE = 'http://localhost:5173';
    await page.goto(BASE, { waitUntil: 'networkidle' });
    logs.push({ type: 'step', text: 'Opened frontend' });

    const timestamp = Date.now();
    const testEmail = 'e2e_student_' + timestamp + '@example.com';

    await page.goto(BASE + '/register', { waitUntil: 'networkidle' });
    await page.fill('#name', 'E2E Student');
    await page.fill('#email', testEmail);
    await page.fill('#password', 'TestPassword123');
    await page.selectOption('#role', 'student');
    await page.click('button:has-text("Create Account")');
    logs.push({ type: 'step', text: 'Attempted register', email: testEmail });
    await page.waitForTimeout(2000);

    const storedToken = await page.evaluate(() => localStorage.getItem('token'));
    const storedUser = await page.evaluate(() => localStorage.getItem('user'));
    logs.push({ type: 'step', text: `Registration token present: ${!!storedToken}, user present: ${!!storedUser}` });
    await page.waitForURL('**/dashboard', { timeout: 5000 }).catch(() => {
      logs.push({ type: 'warn', text: 'Did not redirect to dashboard after registration' });
    });

    await page.goto(BASE + '/courses', { waitUntil: 'networkidle' });
    logs.push({ type: 'step', text: 'Opened courses list' });

    let courseClicked = false;
    const preferredCourse = await page.$('div.cursor-pointer:has-text("React Advanced Patterns")');
    if (preferredCourse) {
      await preferredCourse.click();
      logs.push({ type: 'step', text: 'Selected React Advanced Patterns course' });
      courseClicked = true;
    }

    if (!courseClicked) {
      const freeCourse = await page.$('div.cursor-pointer:has-text("Free")');
      if (freeCourse) {
        await freeCourse.click();
        logs.push({ type: 'step', text: 'Selected free course' });
        courseClicked = true;
      }
    }

    if (!courseClicked) {
      const firstCourse = await page.$('div.cursor-pointer');
      if (firstCourse) {
        await firstCourse.click();
        logs.push({ type: 'step', text: 'Selected first course' });
        courseClicked = true;
      }
    }

    if (!courseClicked) {
      throw new Error('No course card found on courses page');
    }

    await page.waitForTimeout(2000);
    await page.waitForSelector('button:has-text("Enroll Now"), button:has-text("Continue Learning")', { timeout: 10000 }).catch(() => {
      logs.push({ type: 'warn', text: 'Course details buttons did not appear in time' });
    });

    const courseUrl = page.url();
    const courseId = courseUrl.includes('/courses/') ? courseUrl.split('/courses/')[1].split('/')[0] : null;
    logs.push({ type: 'step', text: `Current courseId: ${courseId}` });

    const enrollButton = await page.$('button:has-text("Enroll Now")');
    if (enrollButton) {
      const enabled = await enrollButton.isEnabled();
      logs.push({ type: 'step', text: `Enroll Now enabled: ${enabled}` });
      if (enabled) {
        await enrollButton.click();
        logs.push({ type: 'step', text: 'Clicked Enroll Now' });
        await page.waitForTimeout(2000);
      } else {
        logs.push({ type: 'warn', text: 'Enroll Now button is disabled' });
      }
    } else {
      logs.push({ type: 'warn', text: 'Enroll Now button not found' });
    }

    let lessonId = null;
    const continueButton = await page.$('button:has-text("Continue Learning")');
    if (continueButton) {
      const enabled = await continueButton.isEnabled();
      logs.push({ type: 'step', text: `Continue Learning enabled: ${enabled}` });
      if (enabled) {
        await continueButton.click();
        logs.push({ type: 'step', text: 'Clicked Continue Learning' });
        await page.waitForTimeout(2000);
        const lessonUrl = page.url();
        lessonId = lessonUrl.includes('/lessons/') ? lessonUrl.split('/lessons/')[1].split('/')[0] : null;
        logs.push({ type: 'step', text: `Current lessonId: ${lessonId}` });
      } else {
        logs.push({ type: 'warn', text: 'Continue Learning button is disabled' });
      }
    } else {
      logs.push({ type: 'warn', text: 'Continue Learning button not found' });
    }

    const notesTab = await page.$('button:has-text("AI Notes")');
    if (notesTab) {
      await notesTab.click();
      logs.push({ type: 'step', text: 'Opened AI Notes tab' });
      await page.waitForTimeout(1000);
    } else {
      logs.push({ type: 'warn', text: 'AI Notes tab not found' });
    }

    const notesButton = await page.$('button:has-text("Generate AI Notes")');
    if (notesButton) {
      await notesButton.click();
      logs.push({ type: 'step', text: 'Clicked Generate AI Notes' });
      await page.waitForTimeout(5000);
    } else {
      logs.push({ type: 'warn', text: 'Generate AI Notes button not found' });
    }

    if (lessonId) {
      await page.goto(`${BASE}/ai-quiz?lessonId=${lessonId}`, { waitUntil: 'networkidle' });
      logs.push({ type: 'step', text: 'Opened AI Quiz page' });
      await page.waitForTimeout(1000);

      const generateQuizButton = await page.$('button:has-text("Generate Quiz")');
      if (generateQuizButton) {
        await generateQuizButton.click();
        logs.push({ type: 'step', text: 'Clicked Generate Quiz' });
        await page.waitForTimeout(5000);
      } else {
        logs.push({ type: 'warn', text: 'Generate Quiz button not found' });
      }
    } else {
      logs.push({ type: 'warn', text: 'No lessonId available for AI Quiz' });
    }

    if (courseId) {
      await page.goto(`${BASE}/ai-tutor?courseId=${courseId}`, { waitUntil: 'networkidle' });
      logs.push({ type: 'step', text: 'Opened AI Tutor page' });
      await page.waitForTimeout(1000);

      const tutorInput = await page.$('input[placeholder="Ask your question..."]');
      if (tutorInput) {
        await tutorInput.fill('Explain React hooks');
        await tutorInput.press('Enter');
        logs.push({ type: 'step', text: 'Sent AI Tutor question' });
        await page.waitForTimeout(5000);
      } else {
        logs.push({ type: 'warn', text: 'AI Tutor input not found' });
      }
    } else {
      logs.push({ type: 'warn', text: 'No courseId available for AI Tutor' });
    }

    const out = {
      timestamp: new Date().toISOString(),
      logs,
    };
    const outPath = 'c:\\Users\\Admin\\Desktop\\Code\\New folder\\LMS\\frontend\\vite-project\\e2e\\playwright-result.json';
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log('E2E test finished, logs saved to e2e/playwright-result.json');
  } catch (err) {
    console.error('E2E error', err);
    logs.push({ type: 'error', text: err.message });
  } finally {
    const out = {
      timestamp: new Date().toISOString(),
      logs,
    };
    const outPath = 'c:\\Users\\Admin\\Desktop\\Code\\New folder\\LMS\\frontend\\vite-project\\e2e\\playwright-result.json';
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    await browser.close();
  }
})();
