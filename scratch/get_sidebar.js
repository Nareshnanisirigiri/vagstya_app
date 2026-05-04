const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('https://www.vogstya.com/admin/login');
  
  // Wait for login form
  await page.waitForSelector('input[name="email"]');
  await page.type('input[name="email"]', 'sathyabhama@vogstya.com');
  await page.type('input[name="password"]', 'secret');
  
  // Submit and wait for navigation
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle0' })
  ]);
  
  // Print all sidebar links text
  const sidebarLinks = await page.evaluate(() => {
     const links = Array.from(document.querySelectorAll('.app-sidebar__heading, .app-sidebar a, .metismenu-container li a, .nav-item a, .sidebar-menu li a, .menu-item a, .menu-title'));
     return links.map(l => {
         return {
             text: l.innerText.trim(),
             href: l.getAttribute('href'),
             className: l.className
         };
     }).filter(t => t.text.length > 0);
  });
  
  const rawHtml = await page.evaluate(() => {
     const sidebar = document.querySelector('.app-sidebar') || document.querySelector('.sidebar') || document.querySelector('.main-sidebar');
     return sidebar ? sidebar.innerHTML : 'NO_SIDEBAR_FOUND';
  });
  
  fs.writeFileSync('sidebar_links.json', JSON.stringify(sidebarLinks, null, 2));
  fs.writeFileSync('sidebar_html.html', rawHtml);
  console.log('Successfully extracted sidebar');
  await browser.close();
})();
