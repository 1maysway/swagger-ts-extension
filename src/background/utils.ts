

export const getCurrentTab = async () => (await chrome.tabs.query({ active: true }))[0];