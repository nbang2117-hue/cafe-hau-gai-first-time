const viewer = document.querySelector('.image-viewer');
const viewerImage = document.querySelector('#viewer-image');
const viewerLabel = document.querySelector('#viewer-label');

document.querySelectorAll('.menu-image').forEach((link, index) => {
  link.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (typeof viewer.showModal !== 'function') return;
    event.preventDefault();
    viewerImage.src = link.href;
    viewerImage.alt = link.querySelector('img').alt;
    viewerLabel.textContent = `Menu Soru · Trang ${index + 1} / 8`;
    viewer.showModal();
    viewer.scrollTop = 0;
    viewer.scrollLeft = 0;
  });
});

document.querySelector('#close-viewer').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', (event) => {
  if (event.target !== viewer) return;
  const bounds = viewer.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
});
