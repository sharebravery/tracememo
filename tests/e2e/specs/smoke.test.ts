describe('TraceMemo side panel', () => {
  it('should load extension side panel with valid title and views', async () => {
    const extensionPath = await browser.getExtensionPath();
    const sidePanelUrl = `${extensionPath}/side-panel/index.html`;

    await browser.url(sidePanelUrl);
    await expect(browser).toHaveTitle('TraceMemo');

    // If onboarding screen appears, dismiss it to enter main UI
    const getStartedBtn = await $('button=Get started');
    if (await getStartedBtn.isExisting()) {
      await getStartedBtn.click();
    }

    // Verify main header
    const header = await $('header h1');
    await expect(header).toBeExisting();
    await expect(header).toHaveText('TraceMemo');

    // Verify tablist and primary tabs
    const tablist = await $('[role="tablist"]');
    await expect(tablist).toBeExisting();

    const currentPageTab = await $('button[role="tab"]=Current Page');
    const libraryTab = await $('button[role="tab"]=Library');
    const settingsTab = await $('button[role="tab"]=Settings');

    await expect(currentPageTab).toBeExisting();
    await expect(libraryTab).toBeExisting();
    await expect(settingsTab).toBeExisting();

    // Switch to Library tab
    await libraryTab.click();
    await expect(libraryTab).toHaveAttribute('aria-selected', 'true');

    // Switch to Settings tab
    await settingsTab.click();
    await expect(settingsTab).toHaveAttribute('aria-selected', 'true');

    // Switch back to Current Page tab
    await currentPageTab.click();
    await expect(currentPageTab).toHaveAttribute('aria-selected', 'true');

    // Ensure no boilerplate example classes or components exist
    const boilerplateApp = await $('.App');
    await expect(boilerplateApp).not.toBeExisting();
  });
});
