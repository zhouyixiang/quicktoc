document.getElementById('pageTitle').textContent = t('optionsTitle');
document.getElementById('optionsTitle').textContent = t('optionsTitle');
document.getElementById('hideSingleH1Label').textContent = t('hideSingleH1Label');

const hideSingleH1Checkbox = document.getElementById('hideSingleH1');

chrome.storage.sync.get({hideSingleH1: true}, (items) => {
  hideSingleH1Checkbox.checked = items.hideSingleH1;
});

hideSingleH1Checkbox.addEventListener('change', () => {
  chrome.storage.sync.set({hideSingleH1: hideSingleH1Checkbox.checked});
});